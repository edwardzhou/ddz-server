var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');
var format = require('util').format;
var Code = require('../../../../../shared/code');
var dispatcher = require('../../../util/dispatcher');

var User = require('../../../domain/user');
var UserSession = require('../../../domain/userSession');
var userDao = require('../../../dao/userDao');
var ErrorCode = require('../../../consts/errorCode');
var SignInType = require('../../../consts/consts').SignInType;
var async = require('async');

var userService = require('../../../services/userService');

var Q = require('q');

var signUpQ = Q.nbind(userService.signUp, userService);
var signInByAuthTokenQ = Q.nbind(userService.signInByAuthToken, userService);
var signInByPasswordQ = Q.nbind(userService.signInByPassword, userService);
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
  }).then(function(result) {
      var resp = {};
      resp.user = result.user.toParams();
      resp.sessionToken = result.userSession.sessionToken;
      var connectors = self.app.getServersByType('ddz');
      if(!connectors || connectors.length === 0) {
        utils.invokeCallback(callback, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
        return;
      }

      resp.server = dispatcher.dispatch(result.user.userId, connectors);

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
  var results = {};

  // 1. 创建新用户
  signUpQ(userInfo)
    .then(function(user) {
      // 2. 创建userSession用于跨链接共享用户数据
      results.user = user;
      return createUserSessionQ(user.userId);
    })
    .then(function(newUserSession) {
      // 3. 绑定到session
      results.userSession = newUserSession;
      session.bind(result.user.userId);
      session.set('userId', result.user.UserId);
      session.set('sessionToken', result.userSession.sessionToken);
      return Q.nbind(session.pushAll, session)();
    })
    .then(function() {
      var resp = {
        user : results.user.toParams(),
        sessionToken : results.userSession.sessionToken
      };

      var connectors = self.app.getServersByType('ddz');
      if(!connectors || connectors.length === 0) {
        utils.invokeCallback(next, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
        return;
      }

      // 成功返回用户信息
      resp.server = dispatcher.dispatch(results.user.userId, connectors);
      utils.invokeCallback(next, null, resp);
    })
    .fail(function(error) {
      utils.invokeCallback(next, null, {err: 502});
    });

//  async.waterfall([
//    function(callback){
//      // 1. 创建新用户
//      userDao.createUser(userInfo, function(err, user) {
//        callback(err, user);
//      });
//    }, function(user, callback) {
//      // 2. 绑定到session
//      session.bind(user.userId, function(err) {
//        callback(err, user);
//      });
//    }, function(user, callback) {
//      // 3. 创建userSession用于跨链接共享用户数据
//      UserSession.createSession(user.userId, function(err, uSession) {
//        callback(err, user, uSession);
//      });
//    }, function(user, userSession, callback) {
//      // 4. 设置session数据
//      session.set('userId', user.userId);
//      session.set('sessionToken', userSession.sessionToken);
//      session.pushAll();
//      callback(null, user, userSession);
//    }
//  ], function(err, user, userSession) {
//    if (!!err) {
//      // 创建用户失败
//      utils.invokeCallback(next, err, {err: 502});
//    } else {
//      // 成功返回用户信息
//      var result = {};
//      result.user = user.toParams();
//      result.sessionToken = userSession.sessionToken;
//
//      var connectors = self.app.getServersByType('ddz');
//      if(!connectors || connectors.length === 0) {
//        utils.invokeCallback(next, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
//        return;
//      }
//
//      result.server = dispatcher.dispatch(user.userId, connectors);
//      utils.invokeCallback(next, null, result);
//    }
//  });

};