/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var DomainUtils = require("./domainUtils");

/**
 * 道具
 * @type {Mongoose.Schema}
 */
var ddzUserAssetSchema = new mongoose.Schema({
  userId: Number,
  goodsId: String,    // 道具Id
  goodsName: String,    // 道具名称
  goodsDesc: String,    // 道具描述
  goodsType: String,    // 道具类型 (金币，道具，等级等等)
  goodsAction: String,  // 道具处理类型
  goodsIcon: String,    // 道具图标
  goodsProps: {type: Schema.Types.Mixed, default: {_placeholder:0}},       // 道具属性 (自定义配置)
  sortIndex: {type: Number, default: 255},  // 显示排序
  used_at: {type: Date},
  expired_at: {type: Date, expires: 0},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'ddz_user_assets'
});

ddzUserAssetSchema.index({userId: 1});


var __toParams = function(model, opts) {
  var transObj = {
    _id: model.id,
    goodsId: model.goodsId,
    goodsName: model.goodsName,
    goodsDesc: model.goodsDesc,
    goodsType: model.goodsType,
    goodsAction: model.goodsAction,
    count: model.count,
    goodsIcon: model.goodsIcon,
    remainingSeconds: model.remainingSeconds,
    using: !!model.using ? 1:0,
    //goodsProps: model.goodsProps,
    sortIndex: model.sortIndex
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

ddzUserAssetSchema.statics.toParams = __toParams;

ddzUserAssetSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};



var DdzUserAsset = mongoose.model('DdzUserAsset', ddzUserAssetSchema);

module.exports = DdzUserAsset;