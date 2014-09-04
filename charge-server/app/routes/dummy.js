/**
 * Created by edwardzhou on 14-9-4.
 */

var express = require('express');
var router = express.Router();

var PurchaseOrder = require('../domain/purchaseOrder');
var PubSubEvent = require('../domain/pubSubEvent');
var mongoose = require('mongoose');

/* GET users listing. */
router.get('/', function(req, res) {
  var order_id = req.query.orderId;
  process.nextTick(function() {
    res.send("ok " + order_id + "\n");
    console.log(mongoose);

    var PO = mongoose.model('PurchaseOrder');

    PO.findOneQ({})
      .then(function(po) {
        console.log(po);
      })
      .fail(function(error){
        console.error('error: ', error);
      }).done();
  });
//  PurchaseOrder.findOneQ({})
//    .then(function(po) {
//      res.send(JSON.stringify(po));
//    })
//    .fail(function(error) {
//      res.status(500).send(JSON.stringify(error));
//    }).done();
  //res.send('ok\norderId:' + orderId + '\n');
})
.post('/', function(req, res) {
  res.send('ddd ok\n');
});

module.exports = router;
