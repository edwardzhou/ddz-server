/**
 * Created by edwardzhou on 14-10-9.
 */

var mongoose = require('mongoose-q')();
var DdzGoodsPackage = require('./ddzGoodsPackage');
var PaymentMethod = require('./paymentMethod');

var packagePaymentSchema = mongoose.Schema({
  package: {type: mongoose.Schema.Types.ObjectId, ref: 'DdzGoodsPackage'},
  paymentMethod: {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod'},
  paymentCode: String,
  packageName: String,
  description: String,
  price: Number,
  actual_price: {type: Number},
  memo: String,
  enabled: {type: Boolean, default: true },
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'package_payments'
});

var __toParams = function(model, excludeAttrs) {
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

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  if (!!transObj.paymentMethod && !!transObj.paymentMethod.toParams) {
    transObj.paymentMethod = transObj.paymentMethod.toParams();
  }

  if (!!transObj.package && !!transObj.package.toParams) {
    transObj.package = transObj.package.toParams();
  }

  return transObj;
};

packagePaymentSchema.statics.toParams = __toParams;

packagePaymentSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};

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