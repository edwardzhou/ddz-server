/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");


/**
 * 支付方式
 * 支付方式对应多个支持该支付方式的道具包
 * @type {Mongoose.Schema}
 */
var paymentMethodSchema = new mongoose.Schema({
  methodId: String,       // 支付方式ID
  methodName: String,     // 支付方式名称
  description: String,    // 描述
  enabled: {type: Boolean, default: true}, // 是否启用
  config: {type: mongoose.Schema.Types.Mixed, default: {_placeholder:0}}, // 支付方式配置信息
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'payment_methods'
});


/**
 * 获取该支付方式所支持的道具包
 * @param populate
 * @param onlyEnabled
 * @returns {*}
 */
paymentMethodSchema.methods.getPackagePaymentsQ = function(populate, onlyEnabled) {
  var PackagePayment = require('./packagePayment');
  var criteria  = {paymentMethod_id: this.id};
  if (!!onlyEnabled) {
    criteria.enabled = true;
  }

  var query = PackagePayment.find(criteria);
  if (!!populate) {
    query = query.populate('paymentMethod_id package_id')
  }

  return query.execQ();
};


var __toParams = function(model, opts) {
  var transObj = {
    methodId: model.methodId,
    methodName: model.methodName,
    description: model.description,
    config: model.config,
    enabled: model.enabled
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

paymentMethodSchema.statics.toParams = __toParams;

paymentMethodSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};



var PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;