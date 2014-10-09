/**
 * Created by edwardzhou on 14-10-9.
 */

var mongoose = require('mongoose-q')();

var paymentMethodSchema = new mongoose.Schema({
  methodId: String,
  methodName: String,
  description: String,
  enabled: {type: Boolean, default: true},
  config: {type: mongoose.Schema.Types.Mixed, default: {_placeholder:0}},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'payment_methods'
});

paymentMethodSchema.methods.getPackagePaymentQ = function(populate, onlyEnabled) {
  var PackagePayment = require('./packagePayment');
  var query  = {paymentMethod: this.id};
  if (!!onlyEnabled) {
    query.enabled = true;
  }

  var promise = PackagePayment.find(query);
  if (!!populate) {
    promise = promise.populate('paymentMethod package')
  }

  return promise.execQ();
};

var PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;