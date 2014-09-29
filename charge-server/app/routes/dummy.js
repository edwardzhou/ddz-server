/**
 * Created by edwardzhou on 14-9-4.
 */

var util = require('util');
var express = require('express');
var router = express.Router();


var PurchaseOrder = require('../domain/purchaseOrder');

//var PurchaseOrder = require('../domain/purchaseOrder');
var PubSubEvent = require('../domain/pubSubEvent');

var genError = function(msg, code) {
  var error = new Error(msg);
  error.code = code;
  return error;
};

/* GET users listing. */
router.get('/', function(req, res) {
  var orderId = req.query.orderId;
  //res.send("ok " + orderId + "\n");

  PurchaseOrder.findOneQ({orderId: orderId})
    .then(function(po) {
      console.log(po);
      var error = null;
      if (po == null) {
        throw genError(util.format('PurchaseOrder [orderId: %s] is not exists.', orderId), 0x001);
      } else if (po.status != 0) {
        throw genError(util.format('PurchaseOrder [orderId: %s] already processed.', orderId), 0x002);
      }
      po.status = 1;
      return po.saveQ();
    })
    .then(function(po) {
      var event = PubSubEvent({
        eventName: 'charge',
        eventData: {
          orderId: orderId,
          userId: po.userId
        }
      });
      return event.saveQ();
    })
    .then(function(event) {
      res.send('ok');
    })
    .fail(function(error){
      console.error('error: ', error);
      var respText;
      if (error.code == 0x0002) {
        respText = 'ok';
      }
      else {
        respText = 'failed';
      }
      res.send(respText);
    });
})
.post('/', function(req, res) {
  res.send('ddd ok\n');
});

module.exports = router;
