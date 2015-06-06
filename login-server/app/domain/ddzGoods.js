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
var ddzGoodsSchema = new mongoose.Schema({
  goodsId: String,    // 道具Id
  goodsName: String,    // 道具名称
  goodsDesc: String,    // 道具描述
  goodsType: String,    // 道具类型 (金币，道具，等级等等)
  goodsAction: String,    // 道具类型 (金币，道具，等级等等)
  goodsIcon: String,    // 道具图标
  goodsProps: {type: Schema.Types.Mixed, default: {_placeholder:0}},       // 道具属性 (自定义配置)
  sortIndex: {type: Number, default: 255},  // 显示排序
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'ddz_goods'
});



var __toParams = function(model, opts) {
  var transObj = {
    goodsId: model.goodsId,
    goodsName: model.goodsName,
    goodsDesc: model.goodsDesc,
    goodsType: model.goodsType,
    goodsAction: model.goodsAction,
    goodsIcon: model.goodsIcon,
    goodsProps: model.goodsProps,
    sortIndex: model.sortIndex
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

ddzGoodsSchema.statics.toParams = __toParams;

ddzGoodsSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};



var DdzGoods = mongoose.model('DdzGoods', ddzGoodsSchema);

module.exports = DdzGoods;