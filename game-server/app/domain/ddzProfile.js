/**
 * Created by edwardzhou on 14-7-11.
 */

var mongoose = require('mongoose');
var DomainBase = require('./domainBase');

var DdzProfileSchema = mongoose.Schema({
  userObjId: Schema.Types.ObjectId,
  coins: Number,
  gameStat: {
    won: {type: Number, default: 0},
    lose: {type: Number, default: 0}
  },
  lastSignedIn: {
    appid: Number,
    appVersion: String,
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