/*
 *
 */

var Q = require('q')
  , HTTP = require('q-io/http')
  , BufferStream = require("q-io/buffer-stream")
  , js2xmlbuilder = require('js2xmlparser')
  , XMLSerializer = require('xmldom').XMLSerializer
  , Xml2JSparser = new require('xml2js').Parser()
  , DOMParser = require('xmldom').DOMParser
  , extend = require('util')._extend;

var apiInfo = require('./api-info.json');

var tradingUrl = apiInfo.tradingUrl;
/*
 // The code to take this is:
 var apiCallNames = [];
 $("table tr td:first-child a").each(function(a,b,c) { apiCallNames.push(b.text); });
 console.log(JSON.stringify(apiCallNames));
 // from chrome console url: developer.ebay.com/Devzone/xml/docs/Reference/eBay/index.html
*/
var legalTradingCallnames = apiInfo.legalTradingCallnames;

module.exports.TradingApi = function(opts) {
	return checkTradingParameters(opts)
	.then(execTradingCall);
};

var checkTradingParameters = function(opts) {
	var defopts = {
		sandbox: false,
		SiteId: 0,
		ApiVersion: 863,
		callname: '',
		verifyLegalCallname: true,
		rMode: 'json'
	};
	// do not touch input (review this)
	var options = extend(defopts,opts);
	return preparseTradingRequest(options)
	.then(checkTradingReal);
};

var preparseTradingRequest = function(opts) {
	if(opts.requestJSON) {
		if(!opts.requestJSON.ErrorLanguage) opts.requestJSON.ErrorLanguage = 'en_US';
		opts.rMode = 'json';
	}
	if(opts.requestXmlNode) opts.rMode = 'xmlNode';
	if(opts.requestXmlString) opts.rMode = 'xmlString';
	if(opts.rMode == 'json') return Q(opts);
	if(opts.rMode == 'xmlNode') {
		opts.callname = opts.requestXmlNode.tagName.replace(/Request$/,'');
	}
	if(opts.rMode == 'xmlString') {
		return parseTradingRequestXmlString(opts)
	}
	return Q(opts);
};


var parseTradingRequestXmlString = function(opts) {
	var string = opts.requestXmlString;
	var doc = new DOMParser().parseFromString(string);
	opts.requestXmlNode = doc.documentElement;
	opts.callname=opts.requestXmlNode.tagName.replace(/Request$/,'');
	return Q(opts);
};

var requiredOptions = ['callname','devName','appCert','appName','SiteId'];

var checkTradingReal = function(opts) {
	var missing = [];
	var x = requiredOptions.length;
	while(x--) {
		var optName = requiredOptions[x];
		if (opts[optName] == undefined || opts[optName] ==='') {
			missing.push(optName);
		}
	
	}
	if(missing.length>0) {
		return Q.reject(new Error('Missing parameters in option: ' + missing.join(', ')));
	}
	
	if(opts.verifyLegalCallname === true) {
		if(legalTradingCallnames.indexOf(opts.callname) == -1) {
			return Q.reject(new Error('Illegal callname, "' + opts.callname + '", refer to http://developer.ebay.com/Devzone/xml/docs/Reference/eBay/index.html for a list'));
		}
	}
	return Q(opts);
};

var createTradingApiRequest = function (opts) {
	var reqOption = { "url": '', "method": "POST", "headers": {}, "body":'' };
	reqOption.headers = createTradingApiHeader(opts);
	opts.sentHeaders = reqOption.headers;
	try {
		if(opts.rMode == 'json') {
			var requestData = extend({},opts.requestJSON);
			requestData["@"] = { "xmlns":"urn:ebay:apis:eBLBaseComponents"};
			if(opts.authToken) {
				requestData["RequesterCredentials"] = { "eBayAuthToken": opts.authToken };
			};
			opts.builtXmlRequest = js2xmlbuilder(opts.callname + "Request", requestData);
		}
		if(opts.rMode == 'xmlNode' || opts.rMode == 'xmlString') {
			var doc = opts.requestXmlNode.ownerDocument;
			var rCredential = doc.createElement("RequesterCredentials");
			var eAuthToken = doc.createElement("eBayAuthToken");
			var token = doc.createTextNode(opts.authToken);
			eAuthToken.appendChild(token);
			rCredential.appendChild(eAuthToken);
			opts.requestXmlNode.appendChild(rCredential);
			var xmlString = new XMLSerializer().serializeToString(opts.requestXmlNode);
			opts.builtXmlRequest = '<?xml version="1.0" encoding="UTF-8"?>' + "\n" + xmlString;
		}
		if(opts.sandbox === true) {
			reqOption.url = tradingUrl.sandbox;
		} else {
			reqOption.url = tradingUrl.production;
		}
		reqOption.ssl = true;
		var stream = BufferStream(new Buffer(opts.builtXmlRequest, "utf-8"), "utf-8");
		reqOption.body =stream;
		return Q(reqOption);
	} catch(error) {
		return Q.reject(error);
	}
};

var createTradingApiHeader = function (opts) {
	return {
	'X-EBAY-API-CALL-NAME' : opts.callname,
        'X-EBAY-API-COMPATIBILITY-LEVEL' : opts.ApiVersion,
        'X-EBAY-API-SITEID' : opts.SiteId,
        'X-EBAY-API-DEV-NAME': opts.devName,
        'X-EBAY-API-CERT-NAME': opts.appCert,
        'X-EBAY-API-APP-NAME': opts.appName
	};
};

var singleArrToString = function(data) {
	var rData = {};
	if(!(data instanceof Object)) return data;
	if(data instanceof Array) {
		if(data.length === 1) {
			rData = data[0];
			return rData;
		}
		rData = [];
		var x = data.length;
		while(x--) {
			rData[x] = singleArrToString(data[x]);
		}
		return rData.reverse();
	}
	var keys = Object.keys(data);
	var j = keys.length;
	var i =-1;
	while(++i<j) {
		if(data[keys[i]] instanceof Array && data[keys[i]].length === 1) {
			rData[keys[i]] = singleArrToString(data[keys[i]][0]);
		} else {
			rData[keys[i]] = singleArrToString(data[keys[i]]);
		}
	}
	return rData;
}

var parseResponse = function (opts) {
	var xmlString = opts.responseXml;
	var deferred = Q.defer();
	Xml2JSparser.parseString(xmlString, function(error, data) {
		if(error) {
			opts.parsingError = error;
			opts.response = false;
			deferred.resolve(opts);
		} else {
			delete data[opts.callname + 'Response']['$'];
			data = singleArrToString(data);
			opts.responseWithRoot = data;
			opts.response = data[opts.callname + 'Response'];
			deferred.resolve(opts);
		}
	});
	return deferred.promise;
};

var execTradingCall = function(opts) {
	return createTradingApiRequest(opts)
	.then(HTTP.request)
	.then(function(response) {
		opts.getResponse = function() {
			return response;
		};
		var p = response.body.read().then(function(data) {
			opts.responseXml = data.toString();
			if(opts.parseMode == 'json') return parseResponse(opts);
			return opts;
		});
		return p;
	});
};

module.exports.checkTradingParameters = checkTradingParameters;
module.exports.execTradingCall = execTradingCall;
