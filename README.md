qebayapi
========

Promise oriented ebay api interface. Trading API.

eBay Trading API support xml and soap. This implementation use xml interface. It is almost asynchronous via Kriskoval's Q implemenation of promise.

Just one call now.

    var ebayapi = require("qebayapi");
    
    var options = {appName: '...','appCert':'...','devName':'...','callname':'GetItem','requestJSON':{'ItemID':'341341341'}, parseMode: 'json' };

    ebayapi.TradingApi(options)
    .then(function(response) {
      console.log(response.response.Ack);
      console.log('response': response.response);
    });


It use q-io, so it is almost asynchronous, something could be improved in this field for request xml creation phase.

Advance over other implementation
=================================

https://github.com/benbuckman/nodejs-ebay-api is another nodejs module for ebay api interface

It has a single parameter structured, it means *complete isolation* of every call from each other, ie you can use it concurrently for a number of ebay application (say sandbox and production app), or response type required.

You have the control with little switches, *parseMode*: json, xmlNode, xmlString let you choose what to get back based on your need. (extending this with other parsing method is out of scope)

Input switch, *rMode*: json, xmlNode, xmlString. Let you manage your request as you need, ie manipulate and resend to the eBay, without transforming those in json for passing the library: hey, the eBay trading api is already xml, skip unuseful translations.

It use q promise from kriskowal and q-io, it is completely asynchronous (at least for what is sensible).

It *verify* legal call name! This option could be disabled, but it verify if the callname you pass is in trading api call list, and fail if not conforming. [a simple code to paste into console while surfing ebay api site to generate the callname list is in index.js code as comment:

    var apiCallNames = [];
    $("table tr td:first-child a").each(function(a,b,c) { apiCallNames.push(b.text); });
    console.log(JSON.stringify(apiCallNames));
    // from chrome console url: developer.ebay.com/Devzone/xml/docs/Reference/eBay/index.html
]

It is *only trading api*. Only ebay trading api. It is separate because it use only xml protocol and there are no other way to comminicate with trading api.

Its variable scope is simple, clean, no massive reference to local variable, strong isolation.

Code improvements
=================


Separate concerns:
  1. request creation in its own class, then use strategy pattern: what is rMode (request mode)?
    'json', 'xmlNode', 'xmlString' and ... how to extend it? function or
     {preparse:function(opts), create:function(opts), createHeaders: function(opts) }
  1. parse response: parseMode == 'json' or ... function(opts)

Rationale:
* testing: make ebayXml2JsonParse testable
* improving api. i.e. callname based options
