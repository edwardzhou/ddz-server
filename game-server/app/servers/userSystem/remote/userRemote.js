var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var format = require('util').format;

var User = require('../../../domain/user');
var userDao = require('../../../dao/userDao');
var utils = require('../../../util/utils');

module.exports = function(app) {
  return new UserRemote(app);
};

UserRemote = function(app) {
  this.app = app;
};

remoteHandler = UserRemote.prototype;


UserRemote.prototype.createNewUser = function(userInfo, sessionId, callback) {
  userDao.createUser(userInfo, function(err, user) {
    callback(err, user);
  });
};

remoteHandler.checkSignIn = function(signUpInfo, callback) {

};

remoteHandler.authConn = function(msg, callback) {
  var session = this.app.get('session');
  var backendSession = this.app.backendSession;
  logger.info('[userRemote.authConn] session => ', session);
  logger.info('[userRemote.authConn] backendSession => ', backendSession);
  utils.invokeCallback(callback, null, {result: 'ok'});
};