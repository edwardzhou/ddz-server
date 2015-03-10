/**
 * Created by edwardzhou on 14-7-23.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var User = require('../domain/user');
var DataKeyId = require('../domain/dataKeyId');
var DdzProfile = require('../domain/ddzProfile');
var DdzLoginRewards = require('../domain/ddzLoginRewards');
var LoginRewardTemplate = require('../domain/LoginRewardTemplates');
var DdzUserLevelConfigs = require('../domain/ddzUserLevelConfigs');
var BrokenSaveTemplates = require('../domain/BrokenSaveTemplates');
var DdzBrokenSavings = require('../domain/ddzBrokenSavings');

var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var crypto = require('crypto');
var messageService = require('./messageService');
var userLevelService = require('./userLevelService');

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
  var handsetInfo = userInfo.handset;
  var frontendId = signUpParams.frontendId;
  var frontendSessionId = signUpParams.frontendSessionId;
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
      var nickName = userInfo.nickName || (!!handsetInfo && handsetInfo.model) || newUserId.toString() ;
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
      user.setSignedInHandsetInfo(handsetInfo);
      // 设置注册设备信息
      user.setSignedUpHandsetInfo(handsetInfo);
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
    .then(function() {
      return createUserSessionQ(results.user.userId, handsetInfo.mac, frontendId, frontendSessionId);
    })
    .then(function(newUserSession){
      results.userSession = newUserSession;
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
      utils.invokeCallback(cb, null, results);
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
  var result = {coinsChanged:false};
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
          result.coinsChanged = true;
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
        if (result.coinsChanged ){
          userLevelService.onUserCoinsChanged(userId, true);
        }

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

UserService.doBrokenSaving = function(userId,  callback) {
  logger.info('UserService.doBrokenSaving, userId=', userId);
  var result = {broken_saved:false, new_broken_saving:false};
  User.findOne({userId: userId})
      .populate('ddzProfile ddzBrokenSavings')
      .execQ()
      .then(function(user){
        logger.info('UserService.doBrokenSaving, find user 1.');

        if(user.robot) {
          throw genError("doBrokenSaving: Robot is not be saved.");
        }
        result.user = user;
        result.ddzBrokenSavings = user.ddzBrokenSavings;
        result.ddzProfile = user.ddzProfile;
        logger.info('UserService.doBrokenSaving, result.ddzBrokenSavings=',result.ddzBrokenSavings);
        logger.info('UserService.doBrokenSaving, result.ddzProfile=',result.ddzProfile);
        var func = function(){};
        if (user.ddzBrokenSavings == null) {
          func = function() {
            return BrokenSaveTemplates.findQ({});
          }
        }
        return Q.all([func()]);
      })
      .then(function(saveTemplates){
        logger.info('UserService.doBrokenSaving, find saveTemplate.');
        var func = function(){};
        if (result.ddzBrokenSavings == null){
          var today = new Date();
          today.setHours(23);
          today.setMinutes(59);
          today.setSeconds(59);
          today.setMilliseconds(500);

          saveTemplate = saveTemplates[0][0];
          logger.info('UserService.doBrokenSaving, find saveTemplate. saveTemplate=', saveTemplate);
          result.ddzBrokenSavings = new DdzBrokenSavings();
          result.ddzBrokenSavings.userId = result.user.userId;
          result.ddzBrokenSavings.user_id = result.user.id;
          result.ddzBrokenSavings.last_login_date = today.getTime();
          result.ddzBrokenSavings.count = saveTemplate.count;
          result.ddzBrokenSavings.threshold = saveTemplate.threshold;
          result.ddzBrokenSavings.save_detail = saveTemplate.save_detail;

          result.new_broken_saving = true;
          func = function() {
            logger.info('UserService.doBrokenSaving, result.ddzBrokenSavings.saveQ()');
            return result.ddzBrokenSavings.saveQ();
          }
        }
        return Q.all([func()]);
      })
      .then(function(ddzBrokenSavings){
        logger.info('UserService.doBrokenSaving, save user.ddzBrokenSavings');
        var func = function(){};
        if (result.new_broken_saving){
          result.ddzBrokenSavings = ddzBrokenSavings[0];
          result.user.ddzBrokenSavings = result.ddzBrokenSavings;
          func = function() {
            logger.info('UserService.doBrokenSaving, result.user.saveQ()');
            return result.user.saveQ();
          }
        }
        return Q.all([func()]);
      })
      .then(function(user){
        logger.info('UserService.doBrokenSaving, ddzBrokenSavings.saved_times=', result.ddzBrokenSavings.saved_times);
        logger.info('UserService.doBrokenSaving, ddzBrokenSavings.count=', result.ddzBrokenSavings.count);
        logger.info('UserService.doBrokenSaving, ddzProfile.coins=', result.ddzProfile.coins);
        if (result.ddzProfile.coins < result.ddzBrokenSavings.threshold && result.ddzBrokenSavings.saved_times < result.ddzBrokenSavings.count){
          result.ddzBrokenSavings.saved_times = result.ddzBrokenSavings.saved_times + 1;
          var key = result.ddzBrokenSavings.saved_times + '_broken';
          var saving_coins = result.ddzBrokenSavings.save_detail[key];
          result.ddzProfile.coins = result.ddzProfile.coins + saving_coins;
          result.ddzProfile.save();
          result.ddzBrokenSavings.save();
          result.saving_coins = saving_coins;
          result.broken_saved = true;
        }
        var func = function(){};
        if (result.broken_saved){
          func = function() {
            return UserSession.findOneQ({userId: userId});
          }
        }
        return Q.all([func()]);
      })
      .then(function(userSession){
        logger.info('UserService.doBrokenSaving, try to push broken saving message.');
        logger.info('UserService.doBrokenSaving. result.broken_saved=',result.broken_saved);
        logger.info('UserService.doBrokenSaving, userSession=',userSession);
        if (result.broken_saved) {
          process.nextTick(function () {
            messageService.pushMessage('onUserBrokenSaved',
                {save_coins: result.saving_coins},
                [{uid: result.user.userId, sid: userSession.frontendId}]);
          });
        }
        utils.invokeCallback(callback, null, true);
      })
      .fail(function(error){
        utils.invokeCallback(callback, {code: error.number, msg: error.message}, null);
      });
};



