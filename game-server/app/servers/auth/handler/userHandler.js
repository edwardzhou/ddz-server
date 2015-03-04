var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');
var format = require('util').format;
var Code = require('../../../../../shared/code');
var dispatcher = require('../../../util/dispatcher');

var User = require('../../../domain/user');
var Result = require('../../../domain/result');
var UserSession = require('../../../domain/userSession');
var DdzProfile = require('../../../domain/ddzProfile');
var userDao = require('../../../dao/userDao');
var ErrorCode = require('../../../consts/errorCode');
var SignInType = require('../../../consts/consts').SignInType;
var async = require('async');
var taskService = require('../../../services/taskService');

var userService = require('../../../services/userService');
var messageService = require('../../..//services/messageService');

var Q = require('q');

var signUpQ = Q.nbind(userService.signUp, userService);
var signInByAuthTokenQ = Q.nbind(userService.signInByAuthToken, userService);
var signInByPasswordQ = Q.nbind(userService.signInByPassword, userService);
var updatePasswordQ = Q.nbind(userService.updatePassword, userService);
var deliverLoginRewardQ = Q.nbind(userService.deliverLoginReward, userService);
var createUserSessionQ = Q.nbind(UserSession.createSession, UserSession);

/**
 * Gate handler that dispatch user to connectors.
 */
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.signIn = function(msg, session, next) {
  var self = this;

  var sessionService = this.app.get('sessionService');

  var results = null;

  if (msg == null) {
    utils.invokeCallback(next, null, {err: 500});
    return;
  }

  var loginInfo = {};
  loginInfo.userId = msg.userId;
  loginInfo.signInType = msg.signInType;
  loginInfo.authToken = msg.authToken;
  loginInfo.password = msg.password;
  loginInfo.handset = msg.handsetInfo;
  loginInfo.frontendId = session.frontendId;
  loginInfo.frontendSessionId = session.id;

  if (!msg.authToken && !msg.password) {
    // 参数无效
    utils.invokeCallback(next, null, {err: 501});
    return;
  }

  Q.fcall( function() {
    if (msg.signInType == SignInType.BY_AUTH_TOKEN) {
      return signInByAuthTokenQ(loginInfo);
    } else {
      return signInByPasswordQ(loginInfo);
    }
  })
    .then(function(r) {
      results = r;
//      if (!!session.uid) {
//        return Q.nbind(sessionService.kick, sessionService)(session.uid);
//      }
    })
    .then(function() {
      session.set('userId', results.user.userId);
      session.set('sessionToken', results.userSession.sessionToken);
      session.set('channelId', results.user.appid);
      session.bind(results.user.userId);
      logger.info('[auth.userHandler.signIn] session => ', session);
      return Q.nbind(session.pushAll, session)();
    })
    .then(function() {
      var resp = {};
      resp.user = results.user.toParams();
      resp.sessionToken = results.userSession.sessionToken;
      taskService.fixUserTaskList(results.user);

      if (session.frontendId.indexOf('gate')>=0) {
        var connectors = self.app.getServersByType('ddz');
        if(!connectors || connectors.length === 0) {
          utils.invokeCallback(callback, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
          return;
        }

        resp.server = dispatcher.dispatch(results.user.userId, connectors);
      }

      utils.invokeCallback(next, null, resp);
    })
    .fail(function(error) {
      error.message = ErrorCode.getErrorMessage(error.err);
      utils.invokeCallback(next, null, error);
    });
};

Handler.prototype.signUp = function(msg, session, next) {
  var self = this;
  var userInfo = msg;
  var handsetInfo = msg.handsetInfo || {};
  var results = {};

  // 1. 创建新用户
  signUpQ(userInfo)
    .then(function(r) {
      results = r;
      // 2. 创建userSession用于跨链接共享用户数据
//      results.user = user;
//      return createUserSessionQ(user.userId, handsetInfo.mac, session.frontendId, session.id);
//    })
//    .then(function(newUserSession) {
//      results.userSession = newUserSession;
////      if (!!session.uid) {
////        return Q.nbind(sessionService.unbind, sessionService)(session.uid);
////      }
    })
    .then(function() {
      // 3. 绑定到session
      session.bind(results.user.userId);
      session.set('userId', results.user.userId);
      session.set('sessionToken', results.userSession.sessionToken);
      session.set('channelId', results.user.appid);
      return Q.nbind(session.pushAll, session)();
    })
    .then(function() {
      var resp = {
        user : results.user.toParams(['ddzLoginRewards']),
        sessionToken : results.userSession.sessionToken
      };

      taskService.fixUserTaskList(results.user);

      if (session.frontendId.indexOf('gate')>=0) {
        var connectors = self.app.getServersByType('ddz');
        if(!connectors || connectors.length === 0) {
          utils.invokeCallback(callback, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
          return;
        }

        resp.server = dispatcher.dispatch(results.user.userId, connectors);
      }

//      var connectors = self.app.getServersByType('ddz');
//      if(!connectors || connectors.length === 0) {
//        utils.invokeCallback(next, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
//        return;
//      }
//
//      // 成功返回用户信息
//      resp.server = dispatcher.dispatch(results.user.userId, connectors);
      utils.invokeCallback(next, null, resp);
    })
    .fail(function(error) {
      utils.invokeCallback(next, null, {err: 502});
    });
};

Handler.prototype.updatePassword = function(msg, session, next) {
  var newPassword = msg.password;
  var userId = session.get('userId');
  updatePasswordQ(userId, newPassword)
    .then(function(success) {
      if (success) {
        utils.invokeCallback(next, null, new Result(ErrorCode.SUCCESS));
      } else {
        utils.invokeCallback(next, null, new Result(ErrorCode.SYSTEM_ERROR));
      }
    })
    .fail(function(error) {
      logger.error('[Handler.prototype.updatePassword] error => ', error);
      utils.invokeCallback(next, null, new Result(ErrorCode.SYSTEM_ERROR));
    })
};

Handler.prototype.updateHeadIcon = function(msg, session, next) {
  var newHeadIcon = msg.headIcon;
  var userId = session.get('userId');
  User.findOneQ({userId: userId})
      .then(function(user) {
        user.headIcon = newHeadIcon;
        return user.saveQ();
      })
      .then(function() {
        utils.invokeCallback(next, null, new Result(ErrorCode.SUCCESS));
      })
      .fail(function(error) {
        logger.error('[Handler.prototype.updateHeadIcon] error => ', error);
        utils.invokeCallback(next, null, new Result(ErrorCode.SYSTEM_ERROR));
      })
};

Handler.prototype.deliverLoginReward = function(msg, session, next) {
  var userId = session.get('userId');
  var result = {};
  deliverLoginRewardQ(userId)
      .then(function(r) {
        result = r
      })
      .then(function() {
        utils.invokeCallback(next, null, {result:true, coins:result.rewardCoins});
      })
      .fail(function(error) {
        logger.error('[Handler.prototype.deliverLoginReward] error => ', error);
        utils.invokeCallback(next, null, {result: false, err: error});
      })
};