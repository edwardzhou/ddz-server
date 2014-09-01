/**
 * Created by edwardzhou on 14-9-1.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var utils = require('../util/utils');

var ddzGoodsSchema = new mongoose.Schema({
  goodsName: String,
  goodsDesc: String,
  goodsType: String,
  goodsProps: {},
  sortIndex: {type: Number, default: 255},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});



var __toParams = function(model, excludeAttrs) {
  var transObj = {
    goodsName: model.goodsName,
    goodsDesc: model.goodsDesc,
    goodsType: model.goodsType,
    packageIcon: model.packageIcon,
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