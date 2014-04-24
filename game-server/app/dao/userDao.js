var crypto = require('crypto');
var utils = require('../util/utils');
var User = require('../domain/user');
var ObjectID = require('mongodb').ObjectID;
var ErrorCode = require('../consts/errorCode');
var async = require('async');
var SignInType = require('../consts/consts').SignInType;

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
  var passwordSalt = md5.update(Math.random().toString()).digest('hex');
  var passwordDigest = null;
  if (!!password) {
    passwordDigest = md5.update(password + "_" + passwordSalt).digest('hex');
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

userDao.signIn = function(loginInfo, cb) {
  var loginName = loginInfo.userId;
  var password = loginInfo.password;
  var authToken = loginInfo.authToken;
  var signInType = loginInfo.signInType;
  var sessionToken = loginInfo.sid;
  var imei = loginInfo.handset.imei;
  var signInOk = false;

  async.auto({
    findUser: function(callback) {
      User.findOne( {userId: loginName}, function(err, user) {
        callback(null, user);
      });
    },
    checkUserExists: ['findUser', function(callback, results) {
      var user = results.findUser;
      if (user == null) {
        callback({err: ErrorCode.USER_NOT_FOUND}, false);
        return;
      }
      callback(null, true);
    }],
    checkAuthToken: ['checkUserExists', function(callback, results){
      if (signInType != SignInType.BY_AUTH_TOKEN) {
        callback(null, false);
        return;
      }

      signInOk = results.findUser.verifyToken(authToken, imei);
      var err = null;
      if (!signInOk) {
        err = {err: ErrorCode.PASSWORD_INCORRECT};
      }
      callback(err, signInOk);
     }],
    checkPassword: ['checkUserExists', function(callback, results) {
      if (signInType != SignInType.BY_PASSWORD) {
        callback();
        return false;
      }

      signInOk = results.findUser.verifyPassword(password);
      var err = null;
      if (!signInOk) {
        err = {err: ErrorCode.PASSWORD_INCORRECT};
      }
      callback(err, signInOk);
    }],
    updateAuthToken: ['checkPassword', function(callback, results) {
      if (results.checkPassword != true) {
        callback();
        return;
      }

      var user = results.findUser;
      console.log('updateAuthToken', user);
      user.lastSignedIn.signedInTime = Date.now();
      user.setSignedInHandsetInfo(loginInfo.handset);
      user.updatedAt = Date.now();
      user.save(function(err) {
        callback(err);
      });
    }]
  }, function(err, results){
    console.log(err, results);

    if (!!err) {
      utils.invokeCallback(cb, err, null);
      return;
    }

    if (!signInOk) {
      utils.invokeCallback(cb, {err: ErrorCode.PASSWORD_INCORRECT}, null);
    } else {
      utils.invokeCallback(cb, null, results.findUser);
    }
  });

};
