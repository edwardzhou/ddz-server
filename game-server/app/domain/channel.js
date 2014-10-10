/**
 * Created by edwardzhou on 14-10-9.
 */

var mongoose = require('mongoose-q')();
var PaymentMethod = require('./paymentMethod');

var channelSchema = new mongoose.Schema({
  channelId: Number,
  channelName: String,
  description: String,
  paymentMethod: {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod'},
  enabled: {type: Boolean, default: true},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'channels'
});

channelSchema.statics.getEnabledChannelsQ = function() {
  return this.find({enabled: true})
    .populate('paymentMethod')
    .execQ();
};



var __toParams = function(model, excludeAttrs) {
  var transObj = {
    channelId: model.channelId,
    channelName: model.channelName,
    description: model.description,
    paymentMethod: model.paymentMethod,
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

  return transObj;
};

channelSchema.statics.toParams = __toParams;

channelSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};


var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;