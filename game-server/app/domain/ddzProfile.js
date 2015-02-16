/**
 * Created by edwardzhou on 14-7-11.
 */

var mongoose = require('mongoose-q')();


/**
 * 斗地主用户资料
 */
var DdzProfileSchema = mongoose.Schema({
  userId: Number,   // 用户Id
  user_id: {type: mongoose.Schema.Types.ObjectId},
  coins: {type:Number, default: 10000}, // 金币数
  levelName: String,
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


var __toParams = function(model, excludeAttrs) {
  var transObj = {
    coins: model.coins,
    gameStat: model.gameStat
  };

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

var __getLevelName = function(model) {

};

DdzProfileSchema.statics.toParams = __toParams;

DdzProfileSchema.methods.getLevel = __getLevelName;

DdzProfileSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
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