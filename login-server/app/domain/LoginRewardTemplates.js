/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var DomainUtils = require("./domainUtils");

/**
 * 登录奖励模板
 * @type {Mongoose.Schema}
 */
var LoginRewardTemplatesSchema = new mongoose.Schema({
  login_days: Number,    // 奖励周期
  reward_detail: {type: Schema.Types.Mixed, default: {_placeholder: 0}},       // 奖励定义 (自定义配置)
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'login_reward_templates'
});


var __toParams = function (model, opts) {
  var transObj = {
    login_days: model.login_days,
    reward_detail: model.reward_detail
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

LoginRewardTemplatesSchema.statics.toParams = __toParams;

LoginRewardTemplatesSchema.methods.toParams = function (opts) {
  return __toParams(this, opts);
};


var LoginRewardTemplates = mongoose.model('LoginRewardTemplates', LoginRewardTemplatesSchema);

module.exports = LoginRewardTemplates;