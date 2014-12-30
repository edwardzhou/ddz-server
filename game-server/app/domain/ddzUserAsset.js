/**
 * Created by edwardzhou on 14/12/29.
 */


var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 道具
 * @type {Mongoose.Schema}
 */
var ddzUserAssetSchema = new mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId},
  goodsId: String,    // 道具Id
  goodsName: String,    // 道具名称
  goodsDesc: String,    // 道具描述
  goodsType: String,    // 道具类型 (金币，道具，等级等等)
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

ddzUserAssetSchema.index({user_id: 1});


var __toParams = function(model, excludeAttrs) {
  var transObj = {
    _id: model.id,
    goodsId: model.goodsId,
    goodsName: model.goodsName,
    goodsDesc: model.goodsDesc,
    goodsType: model.goodsType,
    count: model.count,
    goodsIcon: model.goodsIcon,
    //goodsProps: model.goodsProps,
    sortIndex: model.sortIndex
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

ddzUserAssetSchema.statics.toParams = __toParams;

ddzUserAssetSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



var DdzUserAsset = mongoose.model('DdzUserAsset', ddzUserAssetSchema);

module.exports = DdzUserAsset;