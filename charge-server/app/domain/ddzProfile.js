/**
 * Created by edwardzhou on 14-7-11.
 */

var mongoose = require('mongoose-q')();

var DdzProfileSchema = mongoose.Schema({
  userId: Number,
  coins: {type:Number, default: 10000},
  gameStat: {
    won: {type: Number, default: 0},
    lose: {type: Number, default: 0}
  },
  lastSignedIn: {
    appid: Number,
    appVersion: Number,
    resVersion: String,
    signedInTime: {type: Date, default: Date.now},
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
  avatar: String
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

DdzProfileSchema.statics.toParams = __toParams;

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