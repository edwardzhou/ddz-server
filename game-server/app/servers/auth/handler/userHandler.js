var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');
var format = require('util').format;

var User = require('../../../domain/user');
var userDao = require('../../../dao/userDao');

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
  if (msg == null) {
    utils.invokeCallback(next, null, {err: 500});
    return;
  }

  var loginInfo = {};
  loginInfo.userId = msg.userId;
  loginInfo.signInType = msg.signInType;
  loginInfo.authToken = msg.authToken;
  loginInfo.password = msg.password;
  loginInfo.handsetInfo = msg.handsetInfo;

  if (!msg.authToken && !msg.password) {
    utils.invokeCallback(next, null, {err: 501});
    return;
  }

  userDao.signIn(loginInfo, function(err, user) {
    if (err == null) {
      session.bind(user.userId, function() {
        utils.invokeCallback(next, null, {user: user.toParams()});
      });

      return;
    }

    utils.invokeCallback(next, err, err);
  });

};

Handler.prototype.signUp = function(msg, session, next) {
  var userInfo = msg;
  userDao.createUser(userInfo, function(err, user) {
    if (err == null) {
      session.bind(user.userId, function() {
        utils.invokeCallback(next, null, {user: user.toParams()});
      })
      return;
    }

    utils.invokeCallback(next, err, {err: 502});
  });

};