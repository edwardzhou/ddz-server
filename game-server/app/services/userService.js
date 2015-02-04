/**
 * Created by edwardzhou on 14-7-23.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var User = require('../domain/user');
var DataKeyId = require('../domain/dataKeyId');
var DdzProfile = require('../domain/ddzProfile');
var DdzLoginRewards = require('../domain/ddzLoginRewards');
var LoginRewardTemplate = require('../domain/LoginRewardTemplates');
var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var crypto = require('crypto');

var Q = require('q');

var createUserSessionQ = Q.nbind(UserSession.createSession, UserSession);

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

/**
 * 用身份令牌登录
 * @param signInParams
 * @param callback
 */
UserService.signInByAuthToken = function(signInParams, callback) {
  var userId = signInParams.userId;
  var authToken = signInParams.authToken;
  var handsetInfo = signInParams.handset || {};
  var mac = handsetInfo.mac;
  var frontendId = signInParams.frontendId;
  var frontendSessionId = signInParams.frontendSessionId;
  var result = {};

  User.findOne({userId: userId})
    .populate('ddzProfile ddzLoginRewards')
    .execQ()
    .then(function(user) {
      if (user == null) {
        throw genError(ErrorCode.USER_NOT_FOUND);
      }
      logger.info('user.ddzLoginRewards', user.ddzLoginRewards);
      if (!user.verifyToken(authToken, mac)) {
        throw genError(ErrorCode.AUTH_TOKEN_INVALID);
      }

      user.lastSignedIn.signedTime = Date.now();
      user.updated_at = Date.now();

      result.user = user;

      return user.saveQ();
    })
    .then(function(){
      return UserSession.removeQ({userId: result.user.userId});
    })
    .then(function(){
      return createUserSessionQ(result.user.userId, handsetInfo.mac, frontendId, frontendSessionId);
      //return createUserSessionQ(result.user.userId, mac);
    })
    .then(function(newUserSession){
      result.userSession = newUserSession;
    })
    .then(function(){
        logger.info('LoginRewardTemplate.findOneQ() 1');
        return LoginRewardTemplate.findOneQ();
    })
    .then(function(loginRewardTemplate){
        if (loginRewardTemplate == null) {
          console.log('singUp, loginRewardTemplate is null.');
          return;
        }
        logger.info('LoginRewardTemplate.findOneQ() then');
        var ddzLoginReward = result.user.ddzLoginRewards;
        if (ddzLoginReward == null) {
          logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null');
          ddzLoginReward = new DdzLoginRewards();
          ddzLoginReward.userId = result.user.userId;
          ddzLoginReward.user_id = result.user.id;
          ddzLoginReward.last_login_date = Date.now();
          ddzLoginReward.login_days = loginRewardTemplate.login_days;
          ddzLoginReward.total_login_days = 1;
          ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
          ddzLoginReward.reward_detail["day_1"]["status"] = 1;
        }
        else {
          logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else');
          var today = new Date();
          var ast_login_date = new Date(ddzLoginReward.last_login_date);
          var last_login_date_in_day = new Date(ddzLoginReward.last_login_date).setDate(ast_login_date.getDate()+1);
          last_login_date_in_day_date = new Date(last_login_date_in_day);

          if (last_login_date_in_day_date.getDate() != today.getDate())
          {
            logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate()');
            ddzLoginReward.last_login_date = Date.now();
            ddzLoginReward.total_login_days = 1;
            ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
            ddzLoginReward.reward_detail["day_1"]["status"] = 1;
          }
          else {
            logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate() else');
            ddzLoginReward.last_login_date = Date.now();
            ddzLoginReward.total_login_days = ddzLoginReward.total_login_days + 1;
            var v_day = "day_"+ddzLoginReward.total_login_days;
            ddzLoginReward.reward_detail[v_day]["status"] = 1;
          }
        }
        logger.info('LoginRewardTemplate.findOneQ() done.');
        ddzLoginReward.saveQ();
    })
    .then(function(ddzLoginReward){
        logger.info('LoginRewardTemplate.findOneQ() then then');
        result.ddzLoginReward = ddzLoginReward;
        result.user.ddzLoginRewards = ddzLoginReward;
        return result.user.saveQ();
    })
//    .then(function() {
//      return DdzProfile.findOneQ({userId: result.user.userId});
//    })
//    .then(function(ddzProfile) {
//      result.user.ddzProfile = ddzProfile;
//    })
    .then(function(){
      utils.invokeCallback(callback, null, result);
    })
    .fail(function(error){
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      utils.invokeCallback(callback, {err: errCode}, null);
    });
};

/**
 * 密码登录
 * @param signInParams
 * @param callback
 */
UserService.signInByPassword = function(signInParams, callback) {
  var userId = signInParams.userId;
  var password = signInParams.password;
  var frontendId = signInParams.frontendId;
  var frontendSessionId = signInParams.frontendSessionId;
  var handsetInfo = signInParams.handset || {};
  var result = {};

  User.findOne({userId: userId})
    .populate('ddzProfile ddzLoginRewards')
    .execQ()
    .then(function(user) {
      if (user == null) {
        throw genError(ErrorCode.USER_NOT_FOUND);
      }

      if (!user.verifyPassword(password)) {
        throw genError(ErrorCode.PASSWORD_INCORRECT);
      }

      user.lastSignedIn.signedTime = Date.now();
      if (!!handsetInfo) {
        user.setSignedInHandsetInfo(handsetInfo);
      }
      user.updated_at = Date.now();
      user.updateAuthToken();
      result.user = user;

      return user.saveQ();
    })
    .then(function(){
      return UserSession.removeQ({userId: result.user.userId});
    })
    .then(function() {
      return createUserSessionQ(result.user.userId, handsetInfo.mac, frontendId, frontendSessionId);
    })
    .then(function(newUserSession){
      result.userSession = newUserSession;
    })
    .then(function(){
        logger.info('LoginRewardTemplate.findOneQ()');
        return LoginRewardTemplate.findOneQ();
    })
    .then(function(loginRewardTemplate){
        if (loginRewardTemplate == null) {
          console.log('singUp, loginRewardTemplate is null.');
          return;
        }
        logger.info('LoginRewardTemplate.findOneQ() then');
        var ddzLoginReward = result.user.ddzLoginRewards;
        if (ddzLoginReward == null) {
          logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null');
          ddzLoginReward = new DdzLoginRewards();
          ddzLoginReward.userId = result.user.userId;
          ddzLoginReward.user_id = result.user.id;
          ddzLoginReward.last_login_date = Date.now();
          ddzLoginReward.login_days = loginRewardTemplate.login_days;
          ddzLoginReward.total_login_days = 1;
          ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
          ddzLoginReward.reward_detail["day_1"]["status"] = 1;
        }
        else {
          logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else');
          var today = new Date();
          var ast_login_date = new Date(ddzLoginReward.last_login_date);
          var last_login_date_in_day = new Date(ddzLoginReward.last_login_date).setDate(ast_login_date.getDate()+1);
          last_login_date_in_day_date = new Date(last_login_date_in_day);

          if (last_login_date_in_day_date.getDate() != today.getDate())
          {
            logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate()');
            ddzLoginReward.last_login_date = Date.now();
            ddzLoginReward.total_login_days = 1;
            ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
            ddzLoginReward.reward_detail["day_1"]["status"] = 1;
          }
          else {
            logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate() else');
            ddzLoginReward.last_login_date = Date.now();
            ddzLoginReward.total_login_days = ddzLoginReward.total_login_days + 1;
            var v_day = "day_"+ddzLoginReward.total_login_days;
            ddzLoginReward.reward_detail[v_day]["status"] = 1;
          }
        }
        logger.info('LoginRewardTemplate.findOneQ() done.');
        ddzLoginReward.saveQ();
    })
    .then(function(ddzLoginReward){
        logger.info('LoginRewardTemplate.findOneQ() then then');
        result.ddzLoginReward = ddzLoginReward;
        result.user.ddzLoginRewards = ddzLoginReward;
        return result.user.saveQ();
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
  // 随机生成盐值
  var passwordSalt = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  // TODO: 此处设置缺省密码为了开发调试方便
  userInfo.password = userInfo.password || 'abc123';
  var passwordDigest = null;
  if (!!userInfo.password) {
    passwordDigest = _genPasswordDigest(userInfo.password, passwordSalt);
  }

  var userId = null;
  var results = {};

  // 生成一个新的用户ID
  DataKeyId.nextUserIdQ()
    .then(function(newUserId) {
      // 获取昵称: 如果没有提供昵称，则尝试用设备模型做昵称，若还没有设备模型，则用用户ID做昵称
      var nickName = userInfo.nickName || (!!userInfo.handsetInfo && userInfo.handsetInfo.model) || newUserId.toString() ;
      // 确保昵称不超过八位
      if (nickName.length > 8) {
        nickName = nickName.substring(0, 8);
      }
      // 创建用户实例
      var user = new User({
        userId: newUserId,
        nickName: nickName,
        passwordDigest: passwordDigest,
        passwordSalt: passwordSalt,
        appid: userInfo.appid || 1000,
        appVersion: userInfo.appVersion,
        resVersion: userInfo.resVersion,
        created_at: (new Date()),
        updated_at: (new Date())
      });
      // 设置登录设备信息
      user.setSignedInHandsetInfo(userInfo.handsetInfo);
      // 设置注册设备信息
      user.setSignedUpHandsetInfo(userInfo.handsetInfo);
      // 更新身份令牌
      user.updateAuthToken();
      user.oldAuthToken = user.authToken;
      // 保存
      return user.saveQ();
    })
    .then(function(user) {
      results.user = user;

      var ddzProfile = new DdzProfile();
      User.copyHandset(results.user.signedUp.handset, ddzProfile.lastSignedIn.handset);
      ddzProfile.userId = results.user.userId;
      ddzProfile.user_id = results.user.id;
      return ddzProfile.saveQ();
    })
    .then(function(ddzProfile) {
      results.ddzProfile = ddzProfile;
      results.user.ddzProfile = ddzProfile;
      return results.user.saveQ();
    })
    .then(function(){
      return results.user.populateQ('ddzProfile');
    })
    .then(function(){
        return LoginRewardTemplate.findOneQ();
    })
    .then(function(loginRewardTemplate){
        if (loginRewardTemplate == null) {
          console.log('singUp, loginRewardTemplate is null.');
          return;
        }
        var ddzLoginReward = new DdzLoginRewards();
        ddzLoginReward.userId = results.user.userId;
        ddzLoginReward.user_id = results.user.id;
        ddzLoginReward.last_login_date = Date.now();
        ddzLoginReward.login_days = loginRewardTemplate.login_days;
        ddzLoginReward.total_login_days = 1;
        ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
        ddzLoginReward.reward_detail["day_1"]["status"] = 1;
        return ddzLoginReward.saveQ();
    })
    .then(function(ddzLoginReward){
        results.ddzLoginRewards = ddzLoginReward;
        results.user.ddzLoginRewards = ddzLoginReward;
        return results.user.saveQ();
    })
    .then(function(){
      utils.invokeCallback(cb, null, results.user);
    })
    .fail(function(error) {
      utils.invokeCallback(cb, {code: error.number, msg: error.message}, null);
    });
};

UserService.updatePassword = function(userId, newPassword, callback) {
  User.findOneQ({userId: userId})
    .then(function(user) {
      user.password = newPassword;
      return user.saveQ();
    })
    .then(function(){
      utils.invokeCallback(callback, null, true);
    })
    .fail(function(error) {
      logger.error(error);
      utils.invokeCallback(callback, null, false);
    });
};