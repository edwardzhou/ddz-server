/**
 * Created by edwardzhou on 14-9-3.
 */
var mongoose = require('mongoose-q')();

var uuid = require('node-uuid');

var PurchaseOrderSchema = mongoose.Schema({
  orderId: String,
  userId: Number,
  packageId: String,
  packageData: {},
  price: Number,
  paidPrice: Number,
  payment: {},
  appid: Number,
  retryTimes: Number,
  status: Number,
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'purchase_orders'
});


PurchaseOrderSchema.statics.createOrderQ = function(userId, goodsPackage, payMethod, appid) {
  var newOrder = new this();
  newOrder.orderId = uuid.v4().replace(/-/g, '').substr(0, 16);
  newOrder.userId = userId;
  newOrder.appid = appid;
  newOrder.packageId = goodsPackage.packageId;
  newOrder.packageData = (!!goodsPackage.toParams())? goodsPackage.toParams() : goodsPackage;
  newOrder.price = goodsPackage.price;
  newOrder.paidPrice = 0.0;
  newOrder.retryTimes = 0;
  newOrder.status = 0;
  return newOrder.saveQ();
};


var __toParams = function(model, excludeAttrs) {
  var transObj = {
    orderId: model.orderId,
    userId: model.userId,
    packageId: model.packageId,
    packageData: model.packageData,
    price: model.price,
    paidPrice: model.paidPrice,
    retryTimes: model.retryTimes,
    status: model.status
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

PurchaseOrderSchema.statics.toParams = __toParams;

PurchaseOrderSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};


var PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

module.exports = PurchaseOrder;