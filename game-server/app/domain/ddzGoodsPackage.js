/**
 * Created by edwardzhou on 14-9-1.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var utils = require('../util/utils');

var GoodsItemSchema = new mongoose.Schema({
  goodsId: mongoose.Schema.Types.ObjectId,
  goodsCount: {type: Number, default: 1},
  sorIndex: {type: Number, defualt: 255}
});

__GoodsItemToParams = function(model, excludeAttrs) {
  var transObj = {
    goodsId: model.id,
    goodsCount: model.goodsCount,
    sortIndex: model.sortIndex
  };

  if (!!model.goods) {
    transObj.goods = model.goods.toParams();
  }

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

GoodsItemSchema.statics.toParams = __GoodsItemToParams;
GoodsItemSchema.methods.toParams = function(excludeAttrs) {
  return __GoodsItemToParams(this, excludeAttrs);
};

var ddzGoodsPackageSchema = new mongoose.Schema({
  packageName: String,
  packageDesc: String,
  packageType: String,
  packageIcon: String,
  price: Number,
  items: [GoodsItemSchema],
  sortIndex: {type: Number, default: 255},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

ddzGoodsPackageSchema.statics.getGoodsPackagesQ = function() {
  return this.find({}).sort('sortIndex').execQ();
};

var itemsToParams = function(items) {
  var result = [];
  for (var index=0; index<items.length; index++) {
    result.push(items[index].toParams());
  }
  return result;
};

var __toParams = function(model, excludeAttrs) {
  var transObj = {
    packageName: model.packageName,
    packageDesc: model.packageDesc,
    packageType: model.packageType,
    packageIcon: model.packageIcon,
    price: model.price,
    sortIndex: model.sortIndex,
    items: itemsToParams(model.items)
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

ddzGoodsPackageSchema.statics.toParams = __toParams;

ddzGoodsPackageSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



var DdzGoodsPackage = mongoose.model('DdzGoodsPackage', ddzGoodsPackageSchema);

module.exports = DdzGoodsPackage;