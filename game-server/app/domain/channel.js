/**
 * Created by edwardzhou on 14-10-9.
 */

var mongoose = require('mongoose-q')();
var PaymentMethod = require('./paymentMethod');

/**
 * 渠道
 */
var channelSchema = new mongoose.Schema({
  channelId: Number,    // 渠道ID
  channelName: String,  // 渠道名称
  description: String,  // 渠道说明
  paymentMethod: {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod'}, // 所用支付方式
  enabled: {type: Boolean, default: true},  // 是否启用
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'channels' // 对应mongodb的集合名
});


/**
 * 获取启用的渠道
 * @returns {*}
 */
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