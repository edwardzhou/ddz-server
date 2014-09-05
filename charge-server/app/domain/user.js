//var mongoose = require('mongoose');
var mongoose = require('mongoose-q')();

var crypto = require('crypto');
var DomainBase = require('./domainBase');
//var DdzProfile = require('./ddzProfile');

//var signUpSchema = mongoose

var userSchema = new mongoose.Schema({
  userId: Number,
  nickName: String,
  mobileNo: String,
  email: String,
  headIcon: {type: String, default: 'head1'},
  gender: {type: String, default: '女'},
  passwordSalt: String,
  passwordDigest: String,
  authToken: String,
  oldAuthToken: String,
  appid: Number,
  appVersion: String,
  robot: {type: Boolean, default: false},
  robot_busy: {type: Boolean, default: false},
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
  ddzProfile: {type: mongoose.Schema.Types.ObjectId, ref: 'DdzProfile'},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

var md5_data = function(password, salt) {
  var data = password;
  if (!!salt) {
    data = data + "_" + salt;
  }
  return crypto.createHash("md5").update(data).digest('hex');
};

clearHandset = function(handset) {
  handset.model = null;
  handset.os_ver = null;
  handset.fingerprint = null;
  handset.brand = null;
  handset.manufacture = null;
  handset.cpuAbi = null;
  handset.board = null;
  handset.device = null;
  handset.product = null;
  handset.display = null;
  handset.buildId = null;
  handset.imsi = null;
  handset.imei = null;
  handset.mac = null;
};

copyHandset = function(src, dst) {
  if (src == null) {
    return;
  }

  clearHandset(dst);

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

userSchema.virtual('password').set(function(password) {
  if (!this.passwordSalt) {
    this.passwordSalt = md5_data(Math.random().toString());
  }

  this.passwordDigest = md5_data(password, this.passwordSalt);
});

//User.prototype.setPassword = function(password) {
//  if (!this.passwordSalt) {
//    this.passwordSalt = generatePassword(Math.random().toString(), "salt");
//  }
//
//  this.passwordDigest = generatePassword(password, this.passwordSalt);
//};

userSchema.methods.verifyPassword = function(password) {
  var pwdDigest = md5_data(password, this.passwordSalt);

  return pwdDigest == this.passwordDigest;
};

userSchema.methods.setSignedInHandsetInfo = function(handsetInfo) {
  copyHandset(handsetInfo, this.lastSignedIn.handset);
};

userSchema.methods.setSignedUpHandsetInfo = function(handsetInfo) {
  copyHandset(handsetInfo, this.signedUp.handset);
};

userSchema.statics.copyHandset = copyHandset;

userSchema.methods.getAuthToken = function() {
  var imei = this.lastSignedIn.handset.imei;
  var lastLoginTime = this.lastSignedIn.signedInTime || this.createdAt;
  var pwdSalt = this.passwordSalt;

  return md5_data(imei + '_' + lastLoginTime.valueOf() + '_' + pwdSalt);
};

userSchema.methods.updateAuthToken = function() {
  this.oldAuthToken = this.authToken;
  this.authToken = this.getAuthToken();
};

userSchema.methods.verifyToken = function(authToken, mac) {
  //return (this.getAuthToken() == authToken) && (this.lastSignedIn.handset.imei == imei);
  var lastMac = this.lastSignedIn.handset.mac;
  if (!!lastMac && lastMac != mac)
    return false;

  if (authToken == this.authToken && !!this.authToken) {
    if (this.oldAuthToken != this.authToken) {
      this.oldAuthToken = this.authToken;
    }
    return true;
  }

  return (authToken == this.oldAuthToken);
};

var __toParams = function(model, excludeAttrs) {
  var transObj = {
    userId: model.userId,
    nickName: model.nickName,
    authToken: model.authToken,
    gender: model.gender,
    headIcon: model.headIcon,
    lastSignedInTime: model.lastSignedIn.signedInTime
  };
  //ddzProfile: model.ddzProfile.toParams(),

  if (!!model.ddzProfile && !!model.ddzProfile.toParams) {
    transObj.ddzProfile = model.ddzProfile.toParams();
  }

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

userSchema.statics.toParams = __toParams;

userSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};


var User = mongoose.model('User', userSchema);

module.exports = User;
