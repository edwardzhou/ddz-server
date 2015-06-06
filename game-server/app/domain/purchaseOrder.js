/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();

var uuid = require('node-uuid');
var DomainUtils = require("./domainUtils");


/**
 * 道具购买订单
 */
var PurchaseOrderSchema = mongoose.Schema({
  orderId: String,      // 订单编号
  userId: Number,       // 用户id
  packageId: String,    // 道具包id
  packageData: {},      // 道具包数据副本
  price: Number,        // 价格
  paidPrice: Number,    // 支付价格 (渠道有可能做活动打折)
  payment: {},          // 支付数据
  appid: Number,        // 渠道号
  channelId: String,    // 渠道号
  retryTimes: Number,   // 重试次数
  status: Number,       // 状态
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'purchase_orders'
});


PurchaseOrderSchema.index({orderId: 1});
PurchaseOrderSchema.index({userId: 1});

/**
 * 创建订单
 * @param userId - 用户id
 * @param goodsPackage - 道具包
 * @param payMethod - 支付方式
 * @param appid - 渠道ID
 * @returns {*}
 */
PurchaseOrderSchema.statics.createOrderQ = function(userId, goodsPackage, payMethod, appid) {
  var newOrder = new this();
  newOrder.orderId = uuid.v4().replace(/-/g, '').substr(0, 16);
  newOrder.userId = userId;
  newOrder.channelId = appid;
  newOrder.packageId = goodsPackage.packageId;
  newOrder.packageData = (!!goodsPackage.toParams)? goodsPackage.toParams() : goodsPackage;
  newOrder.price = goodsPackage.price;
  newOrder.paidPrice = goodsPackage.price;
  newOrder.retryTimes = 0;
  newOrder.status = 0;
  if (!!payMethod) {
    newOrder.payment = {
      paymentMethod: (!!payMethod.toParams)? payMethod.toParams() : payMethod
    }
  }
  return newOrder.saveQ();
};


var __toParams = function(model, opts) {
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

  transObj = DomainUtils.adjustAttributes(transObj, opts);
  DomainUtils.transAttr(transObj, model, opts, 'payment');

  return transObj;
};

PurchaseOrderSchema.statics.toParams = __toParams;

PurchaseOrderSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};


var PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

module.exports = PurchaseOrder;