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
