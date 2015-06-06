/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var DomainUtils = require("./domainUtils");

/**
 * 玩家破产补助情况
 * @type {Mongoose.Schema}
 */
var DdzBankruptSaveSchema = new mongoose.Schema({
  userId: Number,    // 用户Id
  user_id: {type: mongoose.Schema.Types.ObjectId},
  count: Number,    // 奖励周期
  threshold: Number,    // 奖励周期
  saved_times: {type: Number, default: 0},    // 奖励周期
  autoRemoveAt: {type: Date, expires: 0},
  save_detail: {type: Schema.Types.Mixed, default: {_placeholder: 0}},       // 奖励定义 (自定义配置)
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'ddz_bankrupt_saves'
});

DdzBankruptSaveSchema.index({userId: 1});

var __toParams = function (model, opts) {

  var transObj = {
    saved_times: model.saved_times
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

DdzBankruptSaveSchema.statics.toParams = __toParams;

DdzBankruptSaveSchema.methods.toParams = function (opts) {
  return __toParams(this, opts);
};


var DdzBankruptSave = mongoose.model('DdzBankruptSave', DdzBankruptSaveSchema);

module.exports = DdzBankruptSave;