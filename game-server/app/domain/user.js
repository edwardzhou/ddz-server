var mongoose = require('mongoose');

var signUpSchema = mongoose

var userSchema = new mongoose.Schema({
  userId: Number,
  nickName: String,
  mobileNo: String,
  email: String,
  passwordSalt: String,
  passwordDigest: String,
  authToken: String,
  appid: Number,
  signedUp: {
    appid: Number,
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
  lastSignedIn: {
    appid: Number,
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
    },
    signedInTime: {type: Date, default: Date.now}
  },
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

var User = mongoose.model('User', userSchema);

module.exports = User;

