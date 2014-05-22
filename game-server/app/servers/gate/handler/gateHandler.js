var Code = require('../../../../../shared/code');
var dispatcher = require('../../../util/dispatcher');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var UserId = require('../../../domain/userId');
var utils = require('../../../util/utils');

/**
 * Gate handler that dispatch user to connectors.
 */
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};
//
//Handler.prototype.authConn = function(msg, session, next) {
//  session.set('connAuthed', true);
//  session.push('connAuthed');
//  logger.info('Connection authed~');
//  next(null, {});
//};

Handler.prototype.queryEntry = function(msg, session, next) {
  var self = this;

  var uid = session.uid;
  if(!uid) {
    next(null, {code: Code.FAIL});
    return;
  }
//
//  session.set('my_uid', uid);
//  session.push('my_uid', function() {
//    self.app.rpc.userSystem.userRemote.authConn(session, {}, function(err, data){
//      logger.info('[Handler.prototype.entry] this.app.rpc.userSystem.userRemote.authConn returns : ', err, data);
//    });
//  });

  var connectors = this.app.getServersByType('ddz');
  if(!connectors || connectors.length === 0) {
    next(null, {err: Code.GATE.NO_SERVER_AVAILABLE});
    return;
  }

  var res = dispatcher.dispatch(uid, connectors);
  var result = {code: Code.OK, hosts:[]};
  result.hosts.push({host: res.host, port: res.clientPort});
  next(null, result);


  // next(null, {code: Code.OK, host: res.pubHost, port: res.clientPort});
};

//Handler.prototype.auth = function(msg, session, next) {
//  var username = msg.username;
//  var pwd = msg.pwd;
//  var handsetInfo = msg.handsetInfo;
//  var appInfo = msg.appInfo;
//
//  var loginInfo = {};
//  loginInfo.userId = msg.username;
//  loginInfo.authToken = msg.authToken;
//  loginInfo.handset = msg.handset;
//
//  userDao.signIn();
//  next(null, {});
//};

//Handler.prototype.signIn = function(msg, session, next) {
//  var userInfo = msg;
//  this.app.rpc.userSystem.userRemote.checkSignIn(session, userInfo, '', function(err, user) {
//    console.log('[userRemote.checkSignIn returns] err: %j, user:\n %j', err, user);
//    utils.invokeCallback(next, err, {user: user});
//  });
//};
//
//Handler.prototype.signUp = function(msg, session, next) {
//  var userInfo = msg;
//  this.app.rpc.userSystem.userRemote.createNewUser(session, userInfo, '', function(err, user) {
//    console.log('[userRemote.createNewUser returns] err: %j, user:\n %j', err, user);
//    utils.invokeCallback(next, err, {user: user});
//  });
//};