var User;
User = function (opts) {
  this._id = opts._id;
  this.userId = opts.userId;
  this.nickName = opts.nickName;
  this.appid = opts.appid;
  this.version = opts.version;
  this.loginToken = opts.loginToken;
  this.passwordDigest = opts.passwordDigest;
  this.passwordSalt = opts.passwordSalt;
  this.createdAt = opts.createdAt;
  this.updatedAt = opts.updatedAt;
};

module.exports = User;

