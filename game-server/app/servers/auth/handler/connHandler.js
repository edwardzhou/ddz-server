var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');

var dispatcher = require('../../../util/dispatcher');
var UserSession = require('../../../domain/userSession');
var userDao = require('../../../dao/userDao');
var async = require('async');

var Q = require('q');

/**
 * Gate handler that dispatch user to connectors.
 */
module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

Handler.prototype.authConn = function(msg, session, next) {
  var self = this;

  var userId = msg.userId;
  var sessionToken = msg.sessionToken;
  var authToken = msg.authToken;
  var sessionOk = false;
  var needSignIn = true;
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

  var getByUserIdQ = Q.nbind(userDao.getByUserId, userDao);
  var getSessionByTokenQ = Q.nbind(UserSession.getByToken, UserSession);

  getByUserIdQ(userId)
    .then(function(user){
      session.set('connAuthed', true);
      logger.info('Connection authed~');

      if (user == null) {
        results.error = {needSignUp: true};
        throw new Error('user[userId: ' + userId + '] is not exist.');
      }
      results.user = user;
    })
    .then(function(){
      if (sessionToken == null) {
        results.error = {needSignIn: true};
        throw new Error('user[userId: ' + userId + '] without sessionToken.');
      }
      return getSessionByTokenQ(sessionToken);
    })
    .then(function(usersession){
      if (usersession == null || usersession.userId != userId) {
        results.error = {needSignIn: true};
        throw new Error('user[userId: ' + userId + '] userSession expired.');
      }

      results.userSession = usersession;

      var roomId = results.userSession.sget('roomId');
      var tableId = results.userSession.sget('tableId');
      var gameId = results.userSession.sget('gameId');

      results.resp.roomId = roomId;
      results.resp.tableId = tableId;
      results.resp.gameId = gameId;

      session.set('userId', results.user.userId);
      session.set('sessionToken', results.userSession.sessionToken);
      if (!!roomId)
        session.set('room_id', roomId);
      if (!!tableId)
        session.set('table_id', tableId);
      session.bind(results.user.userId);
      session.set('connAuthed', true);

      return Q.nbind(session.pushAll, session)();
    })
    .then(function(){
      return results.userSession.touchQ();
    })
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
      //logger.info('Connection authed~ ', results.resp);
      utils.invokeCallback(next, null, results.resp);
    })
    .fail(function(error){
      logger.error(error);
      utils.invokeCallback(next, null, results.error);
    });

//  async.waterfall([
//    function(callback) {
//      if (!!userId) {
//        userDao.getByUserId(userId, function(err, user) {
//          if (!err && !!user) {
//            callback(null, user);
//          } else {
//            callback({}, {needSignUp: true});
//          }
//        });
//      } else {
//        callback({}, {needSignUp: true});
//      }
//    },
//    function(user, callback) {
//      if (!!sessionToken) {
//        results.user = user;
//        UserSession.getByToken(sessionToken, callback);
//      } else {
//        callback({}, {needSignIn: true});
//      }
//    },
//    function(userSession, callback) {
//      if(!!userSession && userSession.userId == userId) {
//        results.userSession = userSession;
//        var result = {
//          user: results.user.toParams(),
//          sessionToken: userSession.sessionToken
//        };
//
//        result.roomId = userSession.sget('roomId');
//        result.tableId = userSession.sget('tableId');
//
//        if (session.frontendId.indexOf('gate')>=0) {
//          var connectors = self.app.getServersByType('ddz');
//          if(!connectors || connectors.length === 0) {
//            utils.invokeCallback(callback, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
//            return;
//          }
//
//          result.server = dispatcher.dispatch(results.user.userId, connectors);
//        }
//        utils.invokeCallback(callback, null, result);
//      } else {
//        utils.invokeCallback(callback, {}, {needSignIn: true});
//      }
//    }
//  ], function(err, result) {
//    if (!err) {
//      session.set('userId', results.user.userId);
//      session.set('sessionToken', results.userSession.sessionToken);
//      if (!!result.roomId)
//        session.set('room_id', result.roomId);
//      if (!!result.tableId)
//        session.set('table_id', result.tableId);
//      session.bind(results.user.userId);
//    }
//    session.set('connAuthed', true);
//    session.pushAll( function(){
//      logger.info('Connection authed~', err, result);
//      if (!!err && !result) {
//        utils.invokeCallback(next, null, {needSignUp:true});
//      } else {
//        utils.invokeCallback(next, null, result);
//      }
//      //utils.invokeCallback(next, null, {needSignIn: true});
//    });
//  });

};
