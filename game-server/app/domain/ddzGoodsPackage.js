/**
 * Created by edwardzhou on 14-9-1.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

var GoodsItemSchema = new mongoose.Schema({
  goodsId: mongoose.Schema.Types.ObjectId,
  goodsCount: {type: Number, default: 1},
  sortIndex: {type: Number, defualt: 255}
});

__GoodsItemToParams = function(model, excludeAttrs) {
  var transObj = {
    goodsId: model.goodsId,
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
  packageId: String,
  packageName: String,
  packageDesc: String,
  packageType: String,
  packageIcon: String,
  price: Number,
  items: [GoodsItemSchema],
  sortIndex: {type: Number, default: 255},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'ddz_goods_packages'
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
    packageId: model.packageId,
    packageName: model.packageName,
    packageDesc: model.packageDesc,
    packageType: model.packageType,
    packageIcon: model.packageIcon,
    price: model.price,
    sortIndex: model.sortIndex
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  if (!excludeAttrs || excludeAttrs.indexOf('items')<0 && !!model.items) {
    transObj.items = itemsToParams(model.items);
  }

  return transObj;
};

ddzGoodsPackageSchema.statics.toParams = __toParams;

ddzGoodsPackageSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



var DdzGoodsPackage = mongoose.model('DdzGoodsPackage', ddzGoodsPackageSchema);

module.exports = DdzGoodsPackage;