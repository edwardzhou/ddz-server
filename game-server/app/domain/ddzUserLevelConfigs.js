/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var DomainUtils = require("./domainUtils");

/**
 * 玩家等级名称配置表
 * @type {Mongoose.Schema}
 */
var ddzUserLevelConfigsSchema = new mongoose.Schema({
  level_name: String,
  max_coins: Number,
  min_coins: Number,
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'ddz_user_level_configs'
});


var __toParams = function (model, opts) {
  var transObj = {
    level_name: model.level_name,
    max_coins: model.max_coins,
    min_coins: model.min_coins
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

ddzUserLevelConfigsSchema.statics.toParams = __toParams;

ddzUserLevelConfigsSchema.methods.toParams = function (opts) {
  return __toParams(this, opts);
};


var DdzUserLevelConfigs = mongoose.model('DdzUserLevelConfigs', ddzUserLevelConfigsSchema);

module.exports = DdzUserLevelConfigs;