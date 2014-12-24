/**
 * Created by edwardzhou on 14-9-1.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 道具
 * @type {Mongoose.Schema}
 */
var ddzGoodsSchema = new mongoose.Schema({
  goodsName: String,    // 道具名称
  goodsDesc: String,    // 道具描述
  goodsType: String,    // 道具类型 (金币，道具，等级等等)
  goodsProps: {},       // 道具属性 (自定义配置)
  sortIndex: {type: Number, default: 255},  // 显示排序
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'ddz_goods'
});



var __toParams = function(model, excludeAttrs) {
  var transObj = {
    goodsName: model.goodsName,
    goodsDesc: model.goodsDesc,
    goodsType: model.goodsType,
    packageIcon: model.packageIcon,
    goodsProps: model.goodsProps,
    sortIndex: model.sortIndex
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

ddzGoodsSchema.statics.toParams = __toParams;

ddzGoodsSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



var DdzGoods = mongoose.model('DdzGoods', ddzGoodsSchema);

module.exports = DdzGoods;