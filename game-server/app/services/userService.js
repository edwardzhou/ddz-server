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
var messageService = require('./messageService');

var Q = require('q');
var removeUserSessionQ = Q.nbind(UserSession.removeAllByUserId, UserSession);
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
        ddzLoginReward = UserService.handleLoginReward(result.user, ddzLoginReward, loginRewardTemplate);
        logger.info('LoginRewardTemplate.findOneQ() done.');
        return ddzLoginReward.saveQ();
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
    })
    .done(function(){
        //logger.info("result.ddzLoginReward.toParams=", result.ddzLoginReward.toParams());
        //process.nextTick(function() {
        //  messageService.pushMessage('onLoginReward',
        //      {ddzLoginRewards: result.ddzLoginReward.toParams()},
        //      [{uid: result.user.userId, sid:result.userSession.frontendId}]);
        //});
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
        ddzLoginReward = UserService.handleLoginReward(result.user, ddzLoginReward, loginRewardTemplate);
        logger.info('LoginRewardTemplate.findOneQ() done.');
        return ddzLoginReward.saveQ();
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
    })
    .done(function(){
        //logger.info("result.ddzLoginReward.toParams=", result.ddzLoginReward.toParams());
        //process.nextTick(function() {
        //  messageService.pushMessage('onLoginReward',
        //      {ddzLoginRewards: result.ddzLoginReward.toParams()},
        //      [{uid: result.user.userId, sid:result.userSession.frontendId}]);
        //});
    });
};

UserService.handleLoginReward = function(cur_user, ddzLoginReward, loginRewardTemplate) {
  var today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);
  var oneDayMillSeconds = 3600 * 24  * 1000;

  if (ddzLoginReward == null) {
    logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null');
    ddzLoginReward = new DdzLoginRewards();
    ddzLoginReward.userId = cur_user.userId;
    ddzLoginReward.user_id = cur_user.id;
    ddzLoginReward.last_login_date = today.getTime();
    ddzLoginReward.login_days = loginRewardTemplate.login_days;
    ddzLoginReward.total_login_days = 1;
    ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
    ddzLoginReward.reward_detail["day_1"]["status"] = 1;
  }
  else {
    logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else');
    var diff_login_time = today.getTime() - ddzLoginReward.last_login_date;
    if (diff_login_time > oneDayMillSeconds)
    {
      logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate()');
      ddzLoginReward.last_login_date = today.getTime();
      ddzLoginReward.total_login_days = 1;
      ddzLoginReward.login_days = loginRewardTemplate.login_days;
      ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
      ddzLoginReward.reward_detail["day_1"]["status"] = 1;
    }
    else if(diff_login_time == oneDayMillSeconds) {
      logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate() else');
      ddzLoginReward.last_login_date = today.getTime();
      ddzLoginReward.total_login_days = ddzLoginReward.total_login_days + 1;
      var v_day = 'day_'+ddzLoginReward.total_login_days;
      ddzLoginReward.reward_detail[v_day]["status"] = 1;
      ddzLoginReward.markModified('reward_detail');
    }
  }
  return ddzLoginReward;
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
        var ddzLoginReward = results.user.ddzLoginRewards;
        ddzLoginReward = UserService.handleLoginReward(results.user, ddzLoginReward, loginRewardTemplate);
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

UserService.deliverLoginReward = function(userId, callback) {
  var result = {};
  User.findOne({userId: userId})
      .populate('ddzProfile ddzLoginRewards')
      .execQ()
      .then(function(user){
        if (user.ddzLoginRewards == null){
          throw genError(ErrorCode.LOGIN_REWARD_NULL);
        }
        result.user = user;
        var rewardCoins = 0;
        for(var i=1;i<=user.ddzLoginRewards.login_days;i++){
          var v_day = 'day_'+i;
          if (user.ddzLoginRewards.reward_detail[v_day]["status"] == 1){
            rewardCoins = rewardCoins + user.ddzLoginRewards.reward_detail[v_day]["bonus"];
            user.ddzLoginRewards.reward_detail[v_day]["status"] = 2;
          }
        }
        result.rewardCoins = rewardCoins;
        var funcs = [];
        if (rewardCoins > 0){
          user.ddzProfile.coins = user.ddzProfile.coins + rewardCoins;
          user.ddzLoginRewards.markModified('reward_detail');
          var funca = function(){
            logger.info('UserService.deliverLoginReward, save ddzProfile');
            return user.ddzProfile.saveQ();
          };
          var funcb = function(){
            logger.info('UserService.deliverLoginReward, save  ddzLoginRewards');
            return user.ddzLoginRewards.saveQ();
          };
          funcs.push(funca());
          funcs.push(funcb());
        }
        return Q.all(funcs);
      })
      .then(function(){
        utils.invokeCallback(callback, null, result);
      })
      .fail(function(error){
        utils.invokeCallback(callback, {code: error.number, msg: error.message}, null);
      });
};

UserService.quit = function(userId, callback) {
    logger.info('UserService.quit');
    var result = {};
    removeUserSessionQ(userId)
      .then(function(){
        utils.invokeCallback(callback, null, true);
      })
      .fail(function(error){
        utils.invokeCallback(callback, {code: error.number, msg: error.message}, false);
      });
};

UserService.updateSession = function(userId, callback) {
  logger.info('UserService.quit');
  var result = {};
  UserSession.findOneQ({userId: userId})
      .then(function(userSession){
        if (userSession != null){
          return userSession.touchQ();
        }
      })
      .then(function(){
        utils.invokeCallback(callback, null, true);
      })
      .fail(function(error){
        utils.invokeCallback(callback, {code: error.number, msg: error.message}, false);
      });
};