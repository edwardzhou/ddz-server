/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var DdzGoodsPackage = require('./ddzGoodsPackage');
var PaymentMethod = require('./paymentMethod');
var DomainUtils = require("./domainUtils");


/**
 * 支付方式与道具包的关联表
 */
var packagePaymentSchema = mongoose.Schema({
  package_id: {type: mongoose.Schema.Types.ObjectId, ref: 'DdzGoodsPackage'},  // 道具包
  paymentMethod_id: {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod'},  // 支付方式
  paymentCode: String,  // 支付代码
  packageName: String,  // 道具包名称，用于支持同一个道具包在不同支付方式中用不用的名称, 如为空，则用原来的道具包名称
  description: String,  // 道具包描述, 作用同上
  price: Number,        // 道具包价格, 作用同上
  actual_price: {type: Number}, // 实际价格，应对渠道打折的情况
  memo: String,         // 本关系的备注
  enabled: {type: Boolean, default: true },  // 是否启用
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'package_payments'
});

var __toParams = function(model, opts) {
  var transObj = {
    package: model.package,
    paymentMethod: model.paymentMethod,
    description: model.description,
    paymentCode: model.paymentCode,
    packageName: model.packageName,
    price: model.price,
    actual_price: model.actual_price,
    memo: model.memo,
    enabled: model.enabled
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);
  DomainUtils.transAttr(transObj, model, opts, 'paymentMethod');
  DomainUtils.transAttr(transObj, model, opts, 'package');

  return transObj;
};

packagePaymentSchema.statics.toParams = __toParams;

packagePaymentSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};

packagePaymentSchema.virtual('package')
  .get(function(){
    return this.get('package_id');
  })
  .set(function(v) {
    return this.set('package_id', v);
  });

packagePaymentSchema.virtual('paymentMethod')
  .get(function(){
    return this.get('paymentMethod_id');
  })
  .set(function(v) {
    return this.set('paymentMethod_id', v);
  });


/**
 * 调整道具包在支付方式中的信息
 * @param packagePayment
 */
packagePaymentSchema.statics.fixAttributes = function(packagePayment) {
  if (!packagePayment.packageName) {
    packagePayment.packageName = packagePayment.package.packageName;
  }
  if (!packagePayment.description) {
    packagePayment.description = packagePayment.package.packageDesc;
  }
  if (!packagePayment.price) {
    packagePayment.price = packagePayment.package.price;
  }
  if (!packagePayment.actual_price) {
    packagePayment.actual_price = packagePayment.package.price;
  }
  if (!packagePayment.paymentCode) {
    packagePayment.paymentCode = packagePayment.package.packageId;
  }
};


var PackagePayment = mongoose.model('PackagePayment', packagePaymentSchema);
module.exports = PackagePayment;