var crypto = require('crypto');
var utils = require('../util/utils');
var User = require('../domain/user');
var ObjectID = require('mongodb').ObjectID;
var ErrorCode = require('../consts/errorCode');

var userDao = module.exports;

/**
 *
 * @param userId
 * @param nickName
 * @param appid
 * @param version
 * @param cb
 */
userDao.createUser = function (userId, nickName, password, appid, version, cb) {
  var passwordSalt = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  var passwordDigest = null;
  if (!!password) {
    passwordDigest = crypto.createHash('md5').update(password + "_" + passwordSalt).digest('hex');
  }

  var user = new User({
    userId: userId,
    nickName: nickName,
    passwordDigest: passwordDigest,
    passwordSalt: passwordSalt,
    appid: appid,
    version: version,
    createdAt: (new Date()),
    updatedAt: (new Date())
  });
  user.save(function (err) {
    if (err !== null) {
      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
    } else {
      utils.invokeCallback(cb, null, user);
    }
  });

//  pomelo.app.get('dbclient').collection('users').insert({
//    userId: userId,
//    nickName: nickName,
//    passwordDigest: passwordDigest,
//    passwordSalt: passwordSalt,
//    appid: appid,
//    version: version,
//    createdAt: (new Date()),
//    updatedAt: (new Date())
//  }, function (err, documents) {
//    if (err !== null) {
//      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
//    } else {
//      var doc = documents[0];
//      var user = new User(doc);
//      utils.invokeCallback(cb, null, user);
//    }
//  });
};

userDao.getByUserId = function(userId, cb) {
  pomelo.app.get('dbclient').collection('users').findOne({userId: userId}, function(err, document){
    if (err !== null) {
      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
    } else {
      var user = null;
      if (!!document)
        user = new User(document);
      utils.invokeCallback(cb, null, user);
    }
  });
};

userDao.getUserById = function(id, cb) {
  pomelo.app.get('dbclient').collection('users').findOne({_id: new ObjectID(id)}, function(err, document) {
    if (err !== null) {
      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
    } else {
      var user = null;
      if (!! document)
        user = new User(document);
      utils.invokeCallback(cb, null, user);
    }
  });
};

userDao.login = function(loginInfo, cb) {
  var loginName = loginInfo.userId;
  var password = loginInfo.password;
  User.findOne({userId: loginName}, function(err, user) {
    if (!!err) {
      utils.invokeCallback(cb, err, null);
      return;
    }

    if (user == null) {
      utils.invokeCallback(cb, {err: ErrorCode.USER_NOT_FOUND}, null);
      return;
    }

    if (!user.verifyPassword(password)) {
      utils.invokeCallback(cb, {err: ErrorCode.PASSWORD_INCORRECT}, null);
      return;
    }


    utils.invokeCallback(cb, null, user);

  });
};