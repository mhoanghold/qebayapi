/*
 * Test ebay trading api call
 */

var ebayapi = require('../index.js');


var baseOptions = require('./app-credential.json')
, extend = require('util')._extend;

describe("test ebay api call", function() {

	it('should fail for missing callname', function(done) {
		var options = {};
		ebayapi.TradingApi(options)
		.then(function(result) {
			expect(false).toBe(true);
		})
		.catch(function(reason) {
			//console.log('fail reason of making a call is ', reason.message);
			expect(reason.message).toMatch(/callname/);
		})
		.finally(function() {
			done();
		});
	});

	it("should make getCategories request", function(done) {
		var options = extend({},baseOptions);
 		options.callname = 'GetCategories';
		options.SiteId = 101;
		options.rMode = 'json';
		options.requestJSON = {
			"DetailLevel": "ReturnAll",
			"CategorySiteID": "101",
			"LevelLimit": 1
		};
		ebayapi.TradingApi(options)
		.then(function(response) {
			//console.log('response to request is', response);
			//expect(response.builtXmlRequest).toMatch('.*GetCategoriesRequest.*ReturnAll.*CategorySiteID.*RequesterCredentials.*eBayAuthToken.*');
			expect(response.builtXmlRequest).toMatch(/GetCategoriesRequest/);
			expect(response.builtXmlRequest).toMatch(/ReturnAll/);
			expect(response.builtXmlRequest).toMatch(/CategorySiteID/);
			expect(response.builtXmlRequest).toMatch(/RequesterCredentials/);
			expect(response.builtXmlRequest).toMatch(/eBayAuthToken/);
			expect(response.responseXml).toMatch(/GetCategoriesResponse/);
			expect(response.responseXml).toMatch(/Category>/);
			expect(response.responseXml).toMatch(/CategoryID/);
			expect(response.responseXml).toMatch(/CategoryParentID/);
			expect(response.sentHeaders['X-EBAY-API-SITEID']).toBe(101);
		})
		.catch(function(reason) {
			console.log('get Categories fail reason', reason);
			expect(false).toBe(true);
		})
		.finally(function() {
			done();
		})
		.done();
	});

	it('should make a call and parse as json', function(done) {
		var options = {
			callname: 'AddFixedPriceItem',
			devName: 'hello',
			appCert: 'hello',
			appName: 'appone',
			parseMode: 'json'
		};
		ebayapi.TradingApi(options)
		.then(function(result) {
			//console.log('the result',result);
			expect(result.response.Ack).toBe('Failure');
			//expect(result.response.Errors.ErrorCode).toBe(127);
			//expect(result.response.Errors.ErrorParameters.Value).toBe('appone');
			//expect(true).toBe(true);
		})
		.catch(function(reason) {
			console.log('fail with message', reason);
			expect(false).toBe(true);
		})
		.finally(function(){
			expect(options.ApiVersion === undefined).toBe(true);
			done();
		});
	});


	it('should make a call and parse as xml object', function(done) {
		var reachedTime = 0;
		var startTime = new Date().getTime();
		var options = extend({}, baseOptions);
		options.callname = 'GetCategories';
		options.SiteId = 101;
		var fs = require('fs');
		options.requestXmlString = fs.readFileSync('./Data/addFixedPriceItem-request.xml').toString();
		ebayapi.TradingApi(options)
		.then(function(result) {
			//console.log('the result',result);
			var responseO = result.getResponse();
			expect(responseO.nodeResponse.statusCode).toBe(200);
			// not implemented
			//expect(result.response.Ack).toBe('Failure');
			//expect(result.response.Errors.ErrorCode).toBe(127);
			//expect(result.response.Errors.ErrorParameters.Value).toBe('appone');
			expect(true).toBe(true);
		})
		.catch(function(reason) {
			console.log('fail with message from xml object', reason);
			expect(false).toBe(true);
		})
		.finally(function(){
			expect(options.ApiVersion === undefined).toBe(true);
			expect(new Date().getTime() > reachedTime).toBe(true);
			// I really would expect the following to fail, it would if it was completely async.
			expect(reachedTime).toBeGreaterThan(startTime);
			//console.log('reached',reachedTime,'start',startTime);
			done();
		});
		reachedTime = new Date().getTime();
	});

	it('should make a setNotificationPreferences request the way ...',function(done) {
		var options = extend({}, baseOptions);
		options.callname = 'SetNotificationPreferences';
		options.requestJSON = {
			"ApplicationDeliveryPreferences": {
				"ApplicationEnable": "Enable",
				"DeliveryURLDetails": {
					"DeliveryURLName": 'qlibrarytest',
					"DeliveryURL": "http://www.example.com/",
					"Status": "Enable"
				},
			},
			"DeliveryURLName": 'qlibrarytest',
			"UserDeliveryPreferenceArray": {
				"NotificationEnable": [
					{'EventEnable':'Enable','EventType':'ItemRevised'},
					{'EventEnable':'Enable','EventType':'ItemSold'}
				]
			}
		};
		options.parseMode = 'json';
		ebayapi.TradingApi(options)
		.then(function(response) {
			//console.log('response for set notification',response);
			//console.log(response.builtXmlRequest);
			expect(response.response.Ack).toBe('Success');
		})
		.catch(function(reason) {
			console.log('setNotificationPreferences fails for : ',reason);
			expect(true).toBe(false);
		})
		.finally(function() {
			done();
		});
	});

});
