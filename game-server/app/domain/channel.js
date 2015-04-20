/**
 * Created by edwardzhou on 14-10-9.
 */

var mongoose = require('mongoose-q')();
var PaymentMethod = require('./paymentMethod');
var DomainUtils = require("./domainUtils");

/**
 * 渠道
 */
var channelSchema = new mongoose.Schema({
  channelId: Number,    // 渠道ID
  channelName: String,  // 渠道名称
  description: String,  // 渠道说明
  paymentMethod_id: {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod'}, // 所用支付方式
  enabled: {type: Boolean, default: true},  // 是否启用
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'channels' // 对应mongodb的集合名
});


/**
 * 获取启用的渠道
 * @returns {*}
 */
channelSchema.statics.getEnabledChannelsQ = function() {
  return this.find({enabled: true})
    .populate('paymentMethod_id')
    .execQ();
};

channelSchema.virtual('paymentMethod')
  .get(function(){
    return this.get('paymentMethod_id');
  })
  .set(function(v) {
    return this.set('paymentMethod_id', v);
  });



var __toParams = function(model, opts) {
  var transObj = {
    channelId: model.channelId,
    channelName: model.channelName,
    description: model.description,
    paymentMethod: model.paymentMethod,
    enabled: model.enabled
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);
  DomainUtils.transAttr(transObj, model, opts, 'paymentMethod');

  return transObj;
};

channelSchema.statics.toParams = __toParams;

channelSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};


var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;