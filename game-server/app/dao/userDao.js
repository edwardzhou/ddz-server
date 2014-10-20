var crypto = require('crypto');
var utils = require('../util/utils');
var User = require('../domain/user');
var ObjectID = require('mongodb').ObjectID;
var ErrorCode = require('../consts/errorCode');
var async = require('async');
var SignInType = require('../consts/consts').SignInType;
var DdzProfile = require('../domain/ddzProfile');
var DataKeyId = require('../domain/dataKeyId');

var Q = require('q');

var userDao = module.exports;

var _genPasswordDigest = function (password, salt) {
  return crypto.createHash('md5').update(password + "_" + salt).digest('hex');
};

/**
 *
 * @param userId
 * @param nickName
 * @param appid
 * @param version
 * @param cb
 */
userDao.createUser = function (userInfo, cb) {
  var passwordSalt = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  userInfo.password = userInfo.password || 'abc123';
  var passwordDigest = null;
  if (!!userInfo.password) {
    passwordDigest = _genPasswordDigest(userInfo.password, passwordSalt);
  }

  var userId = null;

  var retrieveNextUserId = DataKeyId.nextUserIdQ;

  var saveNewUser = function(newUserId, cb) {
    var nickName = userInfo.nickName || newUserId.toString();
    var user = new User({
        userId: newUserId,
        nickName: nickName,
        passwordDigest: passwordDigest,
        passwordSalt: passwordSalt,
        appid: userInfo.appid,
        appVersion: userInfo.appVersion,
        resVersion: userInfo.resVersion,
        createdAt: (new Date()),
        updatedAt: (new Date())
    });
    user.setSignedInHandsetInfo(userInfo.handsetInfo);
    user.setSignedUpHandsetInfo(userInfo.handsetInfo);
    user.updateAuthToken();

    return user.saveQ();
  };

  var saveUserDdzProfile = function(newUser, cb) {
    var ddzProfile = new DdzProfile();
    User.copyHandset(newUser.signedUp.handset, ddzProfile.lastSignedIn.handset);
    ddzProfile.userId = newUser.userId;
    ddzProfile.user = newUser;
    newUser.ddzProfile = ddzProfile;
    return ddzProfile.saveQ();
  };

  retrieveNextUserId()
    .then(saveNewUser)
    .then(saveUserDdzProfile)
    .then(function(ddzProfile) {
      utils.invokeCallback(cb, null, ddzProfile.user);
    })
    .fail(function(error){
      utils.invokeCallback(cb, {code: error.number, msg: error.message}, null);
    });

};

userDao.getByUserId = function(userId, cb) {
  User.findOne({userId: userId}, function(err, user) {
    utils.invokeCallback(cb, err, user);
  });
};

userDao.getById = function(id, cb) {
  var objId = id;
  User.findOne({_id: objId}, function(err, user) {
    utils.invokeCallback(cb, err, user);
  });
};

userDao.updatePassword = function(userId, newPassword, cb) {
  var result = false;

  async.auto({
    findUser: function(callback) {
      User.findOne( {userId: userId}, function(err, user) {
        callback(null, user);
      });
    },
    updateUserPassword: ['findUser', function(callback, results) {
      var user = results.findUser;
      if (user == null) {
        callback({err: ErrorCode.USER_NOT_FOUND}, false);
        return;
      }
      user.passwordDigest = _genPasswordDigest(newPassword, user.passwordSalt);
      user.increment();
      user.save(function(err, savedUser, numberAffected) {
        callback(null, numberAffected > 0);
      });
    }]
  }, function(err, results){
    console.log(err, results);

    if (!!err) {
      utils.invokeCallback(cb, err, null);
      return;
    }

    if (!results.updateUserPassword) {
      utils.invokeCallback(cb, {err: ErrorCode.USER_NOT_FOUND}, null);
    } else {
      utils.invokeCallback(cb, null, {});
    }
  });

};