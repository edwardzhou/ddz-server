var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');

var dispatcher = require('../../../util/dispatcher');
var UserSession = require('../../../domain/userSession');
var User = require('../../../domain/user');
var DdzProfile = require('../../../domain/ddzProfile');
var userDao = require('../../../dao/userDao');
var userService = require('../../../services/userService');
var async = require('async');

var Q = require('q');

var getSessionByTokenQ = Q.nbind(UserSession.getByToken, UserSession);
var signInByAuthTokenQ = Q.nbind(userService.signInByAuthToken, userService);

/**
 * Gate handler that dispatch user to connectors.
 */
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

var genError = function(msg, errCode) {
  var error = new Error(msg);
  error.errCode = errCode;
  return error;
};

Handler.prototype.authConn = function(msg, session, next) {
  var self = this;

  var userId = msg.userId;
  var sessionToken = msg.sessionToken;
  var authToken = msg.authToken;
  var sessionOk = false;
  var needSignIn = true;
  var mac = msg.mac;

  var results = {
    resp: {}
  };

  session.set('connAuthed', true);
  logger.info('Connection authed~');
  session.push('connAuthed');

  if (!userId) {
    utils.invokeCallback(next, null, {needSignUp: true})
    return;
  }

  User.findOne({userId: userId})
    .populate('ddzProfile')
    .execQ()
    .then(function(user){
      if (user == null) {
        results.error = {needSignUp: true};
        throw genError('user[userId: ' + userId + '] is not exist.');
      }
      results.user = user;
    })
    .then(function(){
      if (sessionToken == null || !results.user.verifyToken(authToken, mac)) {
        results.error = {needSignIn: true};
        throw genError('user[userId: ' + userId + '] without sessionToken.');
      }
      return getSessionByTokenQ(sessionToken);
    })
    .then(function(usersession) {
      if ((usersession == null) || (usersession.userId != userId) || (usersession.mac != mac)) {
        results.error = {needSignIn: true};
        throw genError('user[userId: ' + userId + '] userSession expired.');
      }

      results.userSession = usersession;
      results.userSession.frontendId = session.frontendId;
      results.userSession.frontendSessionId = session.id;
      return results.userSession.touchQ();
    })
    .then(function() {
      var roomId = results.userSession.sget('roomId');
      var tableId = results.userSession.sget('tableId');
      var gameId = results.userSession.sget('gameId');

      results.resp.roomId = roomId;
      results.resp.tableId = tableId;
      results.resp.gameId = gameId;

      session.set('userId', results.user.userId);
      session.set('channelId', results.user.appid);
      session.set('sessionToken', results.userSession.sessionToken);
      if (!!roomId)
        session.set('room_id', roomId);
      if (!!tableId)
        session.set('table_id', tableId);
      if (!!gameId)
        session.set('game_id', gameId);
      session.bind(results.user.userId);

      return Q.nbind(session.pushAll, session)();
    })
//    .then(function() {
//      return DdzProfile.findOneQ({userId: results.user.userId});
//    })
//    .then(function(ddzProfile) {
//      results.user.ddzProfile = ddzProfile;
//    })
    .then(function(){
      if (session.frontendId.indexOf('gate')>=0) {
        var connectors = self.app.getServersByType('ddz');
        if(!connectors || connectors.length === 0) {
          utils.invokeCallback(callback, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
          return;
        }

        results.resp.server = dispatcher.dispatch(results.user.userId, connectors);
      }

      results.resp.user = results.user.toParams();
      results.resp.sessionToken = results.userSession.sessionToken;
      utils.invokeCallback(next, null, results.resp);
    })
    .fail(function(error){
      logger.error(error);
      utils.invokeCallback(next, null, results.error);
    });
};
