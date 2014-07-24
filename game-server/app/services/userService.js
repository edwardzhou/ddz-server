/**
 * Created by edwardzhou on 14-7-23.
 */
var User = require('../domain/user');
var UserId = require('../domain/userId');
var DdzProfile = require('../domain/ddzProfile');
var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var crypto = require('crypto');

var Q = require('q');

var createUserSessionQ = Q.nbind(UserSession.createSession, UserSession);
var retrieveNextUserId = Q.nbind(UserId.retrieveNextUserId, UserId);

var pomeloApp = null;
var UserService = module.exports;


var _genPasswordDigest = function (password, salt) {
  return crypto.createHash('md5').update(password + "_" + salt).digest('hex');
};

UserService.init = function(app, opts) {
  pomeloApp = app;
};

var genError = function(errCode) {
  var error = new Error();
  error.errCode = errCode;
  return error;
};

UserService.signInByAuthToken = function(signInParams, callback) {
  var userId = signInParams.userId;
  var authToken = signInParams.authToken;
  var handsetInfo = signInParams.handset || {};
  var mac = handsetInfo.mac;
  var result = {};

  User.findOneQ({userId: userId})
    .then(function(user) {
      if (user == null) {
        throw genError(ErrorCode.USER_NOT_FOUND);
      }

      if (!user.verifyToken(authToken, mac)) {
        throw genError(ErrorCode.AUTH_TOKEN_INVALID);
      }

      user.lastSignedIn.signedInTime = Date.now();
      user.updatedAt = Date.now();

      result.user = user;

      return user.saveQ();
    })
    .then(function(){
      return UserSession.removeQ({userId: result.user.userId});
    })
    .then(function(){
      return createUserSessionQ(result.user.userId, mac);
    })
    .then(function(newUserSession){
      result.userSession = newUserSession;
    })
    .then(function(){
      utils.invokeCallback(callback, null, result);
    })
    .fail(function(error){
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      utils.invokeCallback(callback, {err: errCode}, null);
    });
};


UserService.signInByPassword = function(signInParams, callback) {
  var userId = signInParams.userId;
  var password = signInParams.password;
  var handsetInfo = signInParams.handset || {};
  var result = {};

  User.findOneQ({userId: userId})
    .then(function(user) {
      if (user == null) {
        throw genError(ErrorCode.USER_NOT_FOUND);
      }

      if (!user.verifyPassword(password)) {
        throw genError(ErrorCode.PASSWORD_INCORRECT);
      }

      user.lastSignedIn.signedInTime = Date.now();
      if (!!handsetInfo) {
        user.setSignedInHandsetInfo(handsetInfo);
      }
      user.updatedAt = Date.now();
      user.updateAuthToken();
      result.user = user;

      return user.saveQ();
    })
    .then(function(){
      return UserSession.removeQ({userId: result.user.userId});
    })
    .then(function() {
      return createUserSessionQ(result.user.userId, handsetInfo.mac);
    })
    .then(function(newUserSession){
      result.userSession = newUserSession;
    })
    .then(function(){
      utils.invokeCallback(callback, null, result);
    })
    .fail(function(error){
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      utils.invokeCallback(callback, {err: errCode}, null);
    });
};

UserService.signInByMac = function() {

};

UserService.signUp = function(signUpParams, cb) {
  var userInfo = signUpParams;
  var passwordSalt = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  userInfo.password = userInfo.password || 'abc123';
  var passwordDigest = null;
  if (!!userInfo.password) {
    passwordDigest = _genPasswordDigest(userInfo.password, passwordSalt);
  }

  var userId = null;
  var results = {};



  retrieveNextUserId()
    .then(function(newUserId) {
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
      user.oldAuthToken = user.authToken;

      return user.saveQ();
    })
    .then(function(user) {
      results.user = user;

      var ddzProfile = new DdzProfile();
      User.copyHandset(results.user.signedUp.handset, ddzProfile.lastSignedIn.handset);
      ddzProfile.userId = results.user.userId;
      return ddzProfile.saveQ();
    })
    .then(function(ddzProfile) {
      results.ddzProfile = ddzProfile;
      utils.invokeCallback(cb, null, results.user);
    })
    .fail(function(error) {
      utils.invokeCallback(cb, {code: error.number, msg: error.message}, null);
    });
};