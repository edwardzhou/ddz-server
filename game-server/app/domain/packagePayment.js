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

var PackagePayment = mongoose.model('PackagePayment', packagePaymentSchema);
module.exports = PackagePayment;