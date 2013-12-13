var mongoose = require('mongoose');
var crypto = require('crypto');

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
  appVersion: String,
  locked: {type: Boolean, default: false},
  lockedAt: Date,
  comment: String,
  signedUp: {
    appid: Number,
    appVersion: String,
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
    appVersion: String,
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

var generatePassword = function(password, salt) {
  return crypto.createHash('md5').update(password + "_" + salt).digest('hex');
};

var copyHandset = function(src, dst) {
  if (src == null) {
    return;
  }

  dst.model = src.model;
  dst.os_ver = src.os_ver;
  dst.fingerprint = src.fingerprint;
  dst.brand = src.brand;
  dst.manufacture = src.manufacture;
  dst.cpuAbi = src.cpuAbi;
  dst.board = src.board;
  dst.device = src.device;
  dst.product = src.product;
  dst.display = src.display;
  dst.buildId = src.buildId;
  dst.imsi = src.imsi;
  dst.imei = src.imei;
  dst.mac = src.mac;
};


User.prototype.setPassword = function(password) {
  if (!this.passwordSalt) {
    this.passwordSalt = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  }

  this.passwordDigest = generatePassword(password, this.passwordSalt);
};

User.prototype.verifyPassword = function(password) {
  var pwdDigest = generatePassword(password, this.passwordSalt);

  return pwdDigest == this.passwordDigest;
};

User.prototype.setSignedInHandsetInfo = function(handsetInfo) {
  copyHandset(handsetInfo, this.lastSignedIn.handset);
};

User.prototype.setSignedUpHandsetInfo = function(handsetInfo) {
  copyHandset(handsetInfo, this.signedUp.handset);
};

User.prototype.refreshAuthToken = function() {

};