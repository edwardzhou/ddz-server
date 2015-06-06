/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");


/**
 * 斗地主用户资料
 */
var DdzProfileSchema = mongoose.Schema({
  userId: Number,   // 用户Id
  user_id: {type: mongoose.Schema.Types.ObjectId},
  robot: {type: Boolean, default: false},
  coins: {type:Number, default: 6000}, // 金币数
  levelName: {type:String, default: '商人'},
  gameStat: {     // 输赢统计
    won: {type: Number, default: 0},
    lose: {type: Number, default: 0}
  },
  lastSignedIn: {   // 上次登录信息
    appid: Number,  // 渠道id
    appNumber: Number, // apk版本数
    appVersion: String, // apk主版本号
    resVersion: String, // 资源包版本号
    signedTime: {type: Date, default: Date.now},  // 登录时间
    handset: {
      model: String,
      os_ver: String,
      fingerprint: String,
      brand: String,
      manufacture: String,
      cpuAbi: String,
      board: String,
      device: String,
      product: String,
      display: String,
      buildId: String,
      imsi: String,
      imei: String,
      mac: String
    }
  },
  vipLevel: Number,
  avatar: String,
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'ddz_user_profiles'
});

DdzProfileSchema.index({userId: 1});

var __toParams = function(model, opts) {
  var transObj = {
    coins: model.coins,
    levelName: model.levelName,
    gameStat: model.gameStat
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

DdzProfileSchema.statics.toParams = __toParams;

DdzProfileSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};

DdzProfileSchema.statics.updateCoinsByUserIdQ = function(userId, coins) {
  var won, lose;
  if (coins > 0 ) {
    won = 1;
    lose = 0;
  } else {
    won = 0;
    lose = 1;
  }

  return this.findOneAndUpdateQ({userId: userId}, {$inc: {coins: coins, won: won, lose: lose}});
};

DdzProfileSchema.methods.updateCoins = function(coins) {
  this.coins += coins;
  if (coins > 0) {
    this.gameStat.won ++;
  } else if (coins < 0) {
    this.gameStat.lose ++;
  }
};


var DdzProfile = mongoose.model('DdzProfile', DdzProfileSchema);


module.exports = DdzProfile;