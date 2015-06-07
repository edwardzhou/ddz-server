/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var User = require('../domain/user');
var DataKeyId = require('../domain/dataKeyId');
var DdzProfile = require('../domain/ddzProfile');
var DdzGoodsPackage = require('../domain/ddzGoodsPackage');
var GameRoom = require('../domain/gameRoom');
var DdzLoginRewards = require('../domain/ddzLoginRewards');
var LoginRewardTemplate = require('../domain/LoginRewardTemplates');
var DdzUserLevelConfigs = require('../domain/ddzUserLevelConfigs');
var BankruptSaveTemplate = require('../domain/BankruptSaveTemplates');
var DdzBankruptSave = require('../domain/ddzBankruptSaves');

var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var crypto = require('crypto');
var messageService = require('./messageService');
var userLevelService = require('./userLevelService');
//var roomService = require('./roomService');

var Q = require('q');
var removeUserSessionQ = Q.nbind(UserSession.removeAllByUserId, UserSession);
var createUserSessionQ = Q.nbind(UserSession.createSession, UserSession);

var pomeloApp = null;
var UserService = module.exports;

var MILLSECONDS_A_DAY = 3600 * 24 * 1000;


var _genPasswordDigest = function (password, salt) {
  return crypto.createHash('md5').update(password + "_" + salt).digest('hex');
};

UserService.init = function (app, opts) {
  pomeloApp = app;
};

var genError = function (errCode) {
  var error = new Error();
  error.errCode = errCode;
  return error;
};

/**
 * 用身份令牌登录
 * @param signInParams
 * @param callback
 */
UserService.signInByAuthToken = function (signInParams, callback) {
  var userId = signInParams.userId;
  var authToken = signInParams.authToken;
  var handsetInfo = signInParams.handset || {};
  var mac = handsetInfo.mac;
  var frontendId = signInParams.frontendId;
  var frontendSessionId = signInParams.frontendSessionId;
  var result = {};

  var access_token = null;

  if (!!loginInfo.anySDK) {
    access_token = loginInfo.anySDK.access_token;
  }


  User.findOne({userId: userId})
    .populate('ddzProfile ddzLoginRewards')
    .execQ()
    .then(function (user) {
      if (user == null) {
        throw genError(ErrorCode.USER_NOT_FOUND);
      }
      logger.info('user.ddzLoginRewards', user.ddzLoginRewards);
      if (!!access_token && !!user.anySDK && user.anySDK.access_token == access_token) {

        if (!!handsetInfo) {
          user.setSignedInHandsetInfo(handsetInfo);
        }
        user.updateAuthToken();
        // result.user = user;
      }
      else if (!user.verifyToken(authToken, mac)) {
        throw genError(ErrorCode.AUTH_TOKEN_INVALID);
      }

      user.lastSignedIn.signedTime = Date.now();
      user.updated_at = Date.now();

      result.user = user;

      return user.saveQ();
    })
    .then(function () {
      return UserSession.removeQ({userId: result.user.userId});
    })
    .then(function () {
      return createUserSessionQ(result.user.userId, handsetInfo.mac, frontendId, frontendSessionId);
      //return createUserSessionQ(result.user.userId, mac);
    })
    .then(function (newUserSession) {
      result.userSession = newUserSession;
    })
    .then(function () {
      logger.info('LoginRewardTemplate.findOneQ() 1');
      return LoginRewardTemplate.findOneQ();
    })
    .then(function (loginRewardTemplate) {
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
    .then(function (ddzLoginReward) {
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
    .then(function () {
      utils.invokeCallback(callback, null, result);
    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      utils.invokeCallback(callback, {err: errCode}, null);
    })
    .done(function () {
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
UserService.signInByPassword = function (signInParams, callback) {
  var userId = signInParams.userId;
  var password = signInParams.password;
  var frontendId = signInParams.frontendId;
  var frontendSessionId = signInParams.frontendSessionId;
  var handsetInfo = signInParams.handset || {};
  var result = {};

  User.findOne({userId: userId})
    .populate('ddzProfile ddzLoginRewards')
    .execQ()
    .then(function (user) {
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
    .then(function () {
      return UserSession.removeQ({userId: result.user.userId});
    })
    .then(function () {
      return createUserSessionQ(result.user.userId, handsetInfo.mac, frontendId, frontendSessionId);
    })
    .then(function (newUserSession) {
      result.userSession = newUserSession;
    })
    .then(function () {
      logger.info('LoginRewardTemplate.findOneQ()');
      return LoginRewardTemplate.findOneQ();
    })
    .then(function (loginRewardTemplate) {
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
    .then(function (ddzLoginReward) {
      logger.info('LoginRewardTemplate.findOneQ() then then');
      result.ddzLoginReward = ddzLoginReward;
      result.user.ddzLoginRewards = ddzLoginReward;
      return result.user.saveQ();
    })
    .then(function () {
      utils.invokeCallback(callback, null, result);
    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      utils.invokeCallback(callback, {err: errCode}, null);
    })
    .done(function () {
      //logger.info("result.ddzLoginReward.toParams=", result.ddzLoginReward.toParams());
      //process.nextTick(function() {
      //  messageService.pushMessage('onLoginReward',
      //      {ddzLoginRewards: result.ddzLoginReward.toParams()},
      //      [{uid: result.user.userId, sid:result.userSession.frontendId}]);
      //});
    });
};

UserService.handleLoginReward = function (cur_user, ddzLoginReward, loginRewardTemplate) {
  var today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);

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
    ddzLoginReward.auto_delete = today.getTime() + 2 * MILLSECONDS_A_DAY - 1000; // 第二天的23:59:59 后自动删除
  }
  else {
    logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else');
    var diff_login_time = today.getTime() - ddzLoginReward.last_login_date;
    if (diff_login_time > MILLSECONDS_A_DAY) {
      logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate()');
      ddzLoginReward.last_login_date = today.getTime();
      ddzLoginReward.total_login_days = 1;
      ddzLoginReward.login_days = loginRewardTemplate.login_days;
      ddzLoginReward.reward_detail = loginRewardTemplate.reward_detail;
      ddzLoginReward.reward_detail["day_1"]["status"] = 1;
    }
    else if (diff_login_time == MILLSECONDS_A_DAY) {
      logger.info('LoginRewardTemplate.findOneQ() then ddzLoginReward == null else last_login_date_in_day_date.getDate() != today.getDate() else');
      ddzLoginReward.last_login_date = today.getTime();
      if (ddzLoginReward.total_login_days < ddzLoginReward.login_days) {
        ddzLoginReward.total_login_days = ddzLoginReward.total_login_days + 1;
        var v_day = 'day_' + ddzLoginReward.total_login_days;
        ddzLoginReward.reward_detail[v_day]["status"] = 1;

        if (ddzLoginReward.total_login_days < ddzLoginReward.login_days) {
          // 如果连续登录天数未达到周期天数, 则在第二天的23:59:59 后自动删除
          ddzLoginReward.auto_delete = today.getTime() + 2 * MILLSECONDS_A_DAY - 1000;
        } else {
          // 连续天数已经达到周期天数, 在 当天 23:59:59 后自动删除, 以开始新的奖励周期
          ddzLoginReward.auto_delete = today.getTime() + MILLSECONDS_A_DAY - 1000;
        }
      }
      ddzLoginReward.markModified('reward_detail');
    }
  }
  return ddzLoginReward;
};

UserService.signInByMac = function () {

};

UserService.signUp = function (signUpParams, cb) {
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
    .then(function (newUserId) {
      // 获取昵称: 如果没有提供昵称，则尝试用设备模型做昵称，若还没有设备模型，则用用户ID做昵称
      var nickName = userInfo.nickName || (!!handsetInfo && handsetInfo.model) || newUserId.toString();
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
        headIcon: Math.ceil(Math.random() * 10000) % 8 + 1,
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
      if (!!userInfo.anySDK && !!userInfo.anySDK.user_sdk) {
        user.anySDK = user.anySDK || {};
        user.anySDK.user_sdk = userInfo.anySDK.user_sdk;
        user.anySDK.channel = userInfo.anySDK.channel;
        user.anySDK.uid = userInfo.anySDK.uid;
      }
      // 保存
      return user.saveQ();
    })
    .then(function (user) {
      results.user = user;

      var ddzProfile = new DdzProfile();
      User.copyHandset(results.user.signedUp.handset, ddzProfile.lastSignedIn.handset);
      ddzProfile.userId = results.user.userId;
      ddzProfile.user_id = results.user.id;
      ddzProfile.coins = 6000;
      return ddzProfile.saveQ();
    })
    .then(function (ddzProfile) {
      results.ddzProfile = ddzProfile;
      results.user.ddzProfile = ddzProfile;
      return results.user.saveQ();
    })
    .then(function () {
      return results.user.populateQ('ddzProfile');
    })
    .then(function () {
      return createUserSessionQ(results.user.userId, handsetInfo.mac, frontendId, frontendSessionId);
    })
    .then(function (newUserSession) {
      results.userSession = newUserSession;
    })
    .then(function () {
      return LoginRewardTemplate.findOneQ();
    })
    .then(function (loginRewardTemplate) {
      if (loginRewardTemplate == null) {
        console.log('singUp, loginRewardTemplate is null.');
        return;
      }
      var ddzLoginReward = results.user.ddzLoginRewards;
      ddzLoginReward = UserService.handleLoginReward(results.user, ddzLoginReward, loginRewardTemplate);
      return ddzLoginReward.saveQ();
    })
    .then(function (ddzLoginReward) {
      results.ddzLoginRewards = ddzLoginReward;
      results.user.ddzLoginRewards = ddzLoginReward;
      return results.user.saveQ();
    })
    .then(function () {
      utils.invokeCallback(cb, null, results);
    })
    .fail(function (error) {
      utils.invokeCallback(cb, {code: error.number, msg: error.message}, null);
    });

};

UserService.updatePassword = function (userId, newPassword, callback) {
  User.findOneQ({userId: userId})
    .then(function (user) {
      user.password = newPassword;
      return user.saveQ();
    })
    .then(function () {
      utils.invokeCallback(callback, null, true);
    })
    .fail(function (error) {
      logger.error(error);
      utils.invokeCallback(callback, null, false);
    });
};

UserService.deliverLoginReward = function (userId, callback) {
  var result = {coinsChanged: false};
  User.findOne({userId: userId})
    .populate('ddzProfile ddzLoginRewards')
    .execQ()
    .then(function (user) {
      if (user.ddzLoginRewards == null) {
        throw genError(ErrorCode.LOGIN_REWARD_NULL);
      }
      result.user = user;
      var rewardCoins = 0;
      for (var i = 1; i <= user.ddzLoginRewards.login_days; i++) {
        var v_day = 'day_' + i;
        if (user.ddzLoginRewards.reward_detail[v_day]["status"] == 1) {
          rewardCoins = rewardCoins + user.ddzLoginRewards.reward_detail[v_day]["bonus"];
          user.ddzLoginRewards.reward_detail[v_day]["status"] = 2;
        }
      }
      result.rewardCoins = rewardCoins;
      var funcs = [];
      if (rewardCoins > 0) {
        result.coinsChanged = true;
        user.ddzProfile.coins = user.ddzProfile.coins + rewardCoins;
        user.ddzLoginRewards.markModified('reward_detail');
        var funca = function () {
          logger.info('UserService.deliverLoginReward, save ddzProfile');
          return user.ddzProfile.saveQ();
        };
        var funcb = function () {
          logger.info('UserService.deliverLoginReward, save  ddzLoginRewards');
          return user.ddzLoginRewards.saveQ();
        };
        funcs.push(funca());
        funcs.push(funcb());
      }
      return Q.all(funcs);
    })
    .then(function () {
      if (result.coinsChanged) {
        userLevelService.onUserCoinsChanged(userId, true);
      }

      utils.invokeCallback(callback, null, result);
    })
    .fail(function (error) {
      utils.invokeCallback(callback, {code: error.number, msg: error.message}, null);
    });
};

UserService.quit = function (userId, callback) {
  logger.info('UserService.quit');
  var result = {};
  removeUserSessionQ(userId)
    .then(function () {
      utils.invokeCallback(callback, null, true);
    })
    .fail(function (error) {
      utils.invokeCallback(callback, {code: error.number, msg: error.message}, false);
    });
};

UserService.updateSession = function (userId, callback) {
  logger.info('UserService.quit');
  var result = {};
  UserSession.findOneQ({userId: userId})
    .then(function (userSession) {
      if (userSession != null) {
        return userSession.touchQ();
      }
    })
    .then(function () {
      utils.invokeCallback(callback, null, true);
    })
    .fail(function (error) {
      utils.invokeCallback(callback, {code: error.number, msg: error.message}, false);
    });
};

UserService.doBankruptProcess = function (userId, callback) {
  logger.info('UserService.doBankruptProcess, userId=', userId);
  var result = {broken_saved: false, new_broken_saving: false};
  User.findOne({userId: userId})
    .populate('ddzProfile ddzBankruptSave')
    .execQ()
    .then(function (user) {
      logger.info('UserService.doBankruptProcess, find user 1.');

      if (user.robot) {
        throw genError("doBankruptProcess: Robot is not be saved.");
      }
      result.user = user;
      result.ddzBankruptSave = user.ddzBankruptSave;
      result.ddzProfile = user.ddzProfile;
      logger.info('UserService.doBankruptProcess, result.ddzBankruptSave=', result.ddzBankruptSave);
      logger.info('UserService.doBankruptProcess, result.ddzProfile=', result.ddzProfile);
      if (user.ddzBrokenSavings == null) {
        return BankruptSaveTemplate.findOneQ({});
      }
      else {
        return null;
      }
    })
    .then(function (saveTemplate) {
      logger.info('UserService.doBankruptProcess, find saveTemplate.');
      if (result.ddzBankruptSave == null) {
        var today = new Date();
        today.setHours(23);
        today.setMinutes(59);
        today.setSeconds(59);
        today.setMilliseconds(500);

        logger.info('UserService.doBankruptProcess, find saveTemplate. saveTemplate=', saveTemplate);
        result.ddzBankruptSave = new DdzBankruptSave();
        result.ddzBankruptSave.userId = result.user.userId;
        result.ddzBankruptSave.user_id = result.user.id;
        result.ddzBankruptSave.autoRemoveAt = today;
        result.ddzBankruptSave.count = saveTemplate.count;
        result.ddzBankruptSave.threshold = saveTemplate.threshold;
        result.ddzBankruptSave.save_detail = saveTemplate.save_detail;

        result.new_broken_saving = true;
        return result.ddzBankruptSave.saveQ();
      }
      else {
        return null;
      }
    })
    .then(function (ddzBankruptSave) {
      logger.info('UserService.doBankruptProcess, save user.ddzBrokenSavings');
      if (result.new_broken_saving) {
        result.ddzBankruptSave = ddzBankruptSave;
        result.user.ddzBankruptSave = result.ddzBankruptSave;
        return result.user.saveQ();
      }
      else {
        return null;
      }
    })
    .then(function (user) {
      logger.info('UserService.doBankruptProcess, ddzBankruptSave.saved_times=', result.ddzBankruptSave.saved_times);
      logger.info('UserService.doBankruptProcess, ddzBankruptSave.count=', result.ddzBankruptSave.count);
      logger.info('UserService.doBankruptProcess, ddzProfile.coins=', result.ddzProfile.coins);
      if (result.ddzProfile.coins < result.ddzBankruptSave.threshold && result.ddzBankruptSave.saved_times < result.ddzBankruptSave.count) {
        result.ddzBankruptSave.saved_times = result.ddzBankruptSave.saved_times + 1;
        var key = 'bankrupt_' + result.ddzBankruptSave.saved_times;
        var saving_coins = result.ddzBankruptSave.save_detail[key];
        result.ddzProfile.coins = result.ddzProfile.coins + saving_coins;
        result.ddzProfile.save();
        result.ddzBankruptSave.save();
        result.saving_coins = saving_coins;
        result.broken_saved = true;
      }
      if (result.broken_saved) {
        return UserSession.findOneQ({userId: userId});
      }
      else {
        return null;
      }
    })
    .then(function (userSession) {
      logger.info('UserService.doBankruptProcess, try to push broken saving message.');
      logger.info('UserService.doBankruptProcess. result.broken_saved=', result.broken_saved);
      if (result.broken_saved) {
        var msgData = {
          save_times: result.ddzBankruptSave.saved_times,
          save_coins: result.saving_coins,
          coins: result.ddzProfile.coins
        };
        var target = [{uid: result.user.userId, sid: userSession.frontendId}];
        process.nextTick(function () {
          logger.info('[UserService.doBankruptProcess] msgData: ', msgData);
          logger.info('[UserService.doBankruptProcess] target: ', target);
          messageService.pushMessage('onUserBankruptSaved', msgData, target);
        });
      }
      utils.invokeCallback(callback, null, true);
    })
    .fail(function (error) {
      if (error.errCode == "doBankruptProcess: Robot is not be saved.") {
        logger.info('UserService.doBankruptProcess msg:', error.errCode);
        utils.invokeCallback(callback, null, true);
      }
      else {
        logger.error('UserService.doBankruptProcess failed. error:', error);
        utils.invokeCallback(callback, {code: error.number, msg: error.message}, null);
      }
    });
};

UserService.findMatchingGameRoom = function(user, room_id, callback) {
  var results = {};
  results.ddzProfile = user.ddzProfile;

  var returnValues = {};

  GameRoom.getActiveRoomsQ(room_id)
    .then(function(rooms) {
      // 如果要进入的房间不存在
      if (!!rooms && rooms.length == 0) {
        // 则选出所有房间, 尝试为用户匹配合适的房间
        return GameRoom.getActiveRoomsQ();
      }

      return rooms;
    })
    .then(function(rooms){
      results.rooms = rooms;
      returnValues.rooms = rooms;

      var ddzProfile = results.ddzProfile;

      for (var index=0; index<results.rooms.length; index++) {
        var room = results.rooms[index];
        if (room.minCoinsQty <= ddzProfile.coins && room.maxCoinsQty > ddzProfile.coins) {
          results.room = room;
          break;
        }
      }
    })
    .then(function(){
      if (!results.room) {
        // 没有可进入的房间
        // 返回 充值 道具包
        return DdzGoodsPackage.findOneQ({packageId: results.rooms[0].recruitPackageId});
      }

      return null;
    })
    .then(function(ddzPkg) {
      if (!!ddzPkg) {
        results.ddzGoodsPackage = ddzPkg;
      }
    })
    .then(function(){
      if (!!results.room) {
        returnValues.room = results.room;
        returnValues.room_id = results.room.roomId;
        if (results.ddzProfile.coins < results.room.minCoinsQty) {
          returnValues.needRecharge = 1;
        }
        else {
          returnValues.needRecharge = 0;
        }
      } else {
        returnValues.ddzGoodsPackage = results.ddzGoodsPackage;
        returnValues.room = results.rooms[0];
        returnValues.needRecharge = 1;
      }
      utils.invokeCallback(callback, null, returnValues);
    })
    .fail(function(err) {
      utils.invokeCallback(callback, {err: err}, null);
    });
};

UserService.findMatchingGameRoomQ = Q.nbind(UserService.findMatchingGameRoom, UserService);

UserService.doUserCoinsQtyChecking = function(player, gameRoom, callback) {
  var roomGrade = 0; // no change
  logger.debug('[UserService.doUserCoinsQtyChecking] player: ', player);
  logger.debug('[UserService.doUserCoinsQtyChecking] gameRoom: ', gameRoom);
  if (player.ddzProfile.coins >= gameRoom.minCoinsQty && player.ddzProfile.coins <= gameRoom.maxCoinsQty) {
    logger.debug('[UserService.doUserCoinsQtyChecking] coins [%d] still okay  ', player.ddzProfile.coins);

    utils.invokeCallback(callback, null, null);
    return;
  }
  if (player.ddzProfile.coins > gameRoom.maxCoinsQty) {
    roomGrade = 1; // room up
  } else {
    roomGrade = -1; // room down
  }

  var ddzGoodsPkg = null;

  //roomService.leave(gameRoom.roomId, player.userId);

  var curRoomDdzPkg = null;
  var room_id = null;
  if (roomGrade <= 0) {
    //room_id = gameRoom.roomId;
  }

  Q.fcall(function() {
    if (roomGrade <= 0) {
      return DdzGoodsPackage.findOneQ({packageId: gameRoom.recruitPackageId});
    }

    return null;
  })
    .then(function(ddzPkg) {
      if (!!ddzPkg) {
        curRoomDdzPkg = ddzPkg;
      }
      return UserService.findMatchingGameRoomQ(player, room_id);
    })
    .then(function(returnValues) {
      logger.debug('returnValues: ', returnValues);
      if (!!returnValues.room && gameRoom.roomId == returnValues.room.roomId ) {
        roomGrade = 0; // no change
      }

      returnValues.curRoomDdzPkg = curRoomDdzPkg;
      returnValues.roomGrade = roomGrade;
      returnValues.player = player;
      returnValues.curRoom = gameRoom;
      //returnValues.originRoomGoodsPkg = ddzGoodsPkg;
      logger.debug('return returnValues: ', returnValues);
      utils.invokeCallback(callback, null, returnValues);
    })
    .fail(function(err) {
      logger.error('[UserService.doUserCoinsQtyChecking] error: ', err);
      utils.invokeCallback(callback, err, {});
    });
};

UserService.doUserCoinsQtyCheckingQ = Q.nbind(UserService.doUserCoinsQtyChecking, UserService);

