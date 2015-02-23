/**
 * Created by edwardzhou on 14-9-1.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 道具包的细项
 * @type {Mongoose.Schema}
 */
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


/**
 * 道具包，用户可直接购买的物品
 * @type {Mongoose.Schema}
 */
var ddzGoodsPackageSchema = new mongoose.Schema({
  packageId: String,    // 道具包ID
  packageName: String,  // 道具包名称
  packageDesc: String,  // 道具包描述
  packageType: String,  // 道具包类型
  packageIcon: String,  // 道具包Icon
  price: Number,        // 价格
  enabled: {type: Boolean, default: true},  // 是否启用
  items: [GoodsItemSchema],                 // 道具明细
  sortIndex: {type: Number, default: 255},  // 显示顺序
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
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

  if (model.packageCoins != null) {
    transObj.packageCoins = model.packageCoins;
  }

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