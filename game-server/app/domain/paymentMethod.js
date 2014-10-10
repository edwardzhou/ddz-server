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

paymentMethodSchema.methods.getPackagePaymentsQ = function(populate, onlyEnabled) {
  var PackagePayment = require('./packagePayment');
  var criteria  = {paymentMethod: this.id};
  if (!!onlyEnabled) {
    criteria.enabled = true;
  }

  var query = PackagePayment.find(criteria);
  if (!!populate) {
    query = query.populate('paymentMethod package')
  }

  return query.execQ();
};


var __toParams = function(model, excludeAttrs) {
  var transObj = {
    methodId: model.methodId,
    methodName: model.methodName,
    description: model.description,
    config: model.config,
    enabled: model.enabled
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

paymentMethodSchema.statics.toParams = __toParams;

paymentMethodSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



var PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

module.exports = PaymentMethod;