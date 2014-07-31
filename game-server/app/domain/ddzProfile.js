/**
 * Created by edwardzhou on 14-7-11.
 */

var mongoose = require('mongoose-q')();

var DdzProfileSchema = mongoose.Schema({
  userId: Number,
  coins: Number,
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
});

var __toParams = function(model, excludeAttrs) {
  var transObj = {
    coins: model.coins,
    gameStat: model.gameStat
  };

  if (!!excludeAttrs) {
    for (var index in excludeAttrs) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

DdzProfileSchema.statics.toParams = __toParams;

DdzProfileSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};


var DdzProfile = mongoose.model('DdzProfile', DdzProfileSchema);


module.exports = DdzProfile;