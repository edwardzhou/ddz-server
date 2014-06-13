var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');

var dispatcher = require('../../../util/dispatcher');
var UserSession = require('../../../domain/userSession');
var userDao = require('../../../dao/userDao');
var async = require('async');

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
  var sessionOk = false;
  var needSignIn = true;
  var results = {};

  async.waterfall([
    function(callback) {
      if (!!userId) {
        userDao.getByUserId(userId, function(err, user) {
          if (!err && !!user) {
            callback(null, user);
          } else {
            callback({}, {needSignUp: true});
          }
        });
      } else {
        callback({}, {needSignUp: true});
      }
    },
    function(user, callback) {
      if (!!sessionToken) {
        results.user = user;
        UserSession.getByToken(sessionToken, callback);
      } else {
        callback({}, {needSignIn: true});
      }
    },
    function(userSession, callback) {
      if(!!userSession && userSession.userId == userId) {
        results.userSession = userSession;
        var result = {
          user: results.user.toParams(),
          sessionToken: userSession.sessionToken
        };

        var connectors = self.app.getServersByType('ddz');
        if(!connectors || connectors.length === 0) {
          utils.invokeCallback(callback, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
          return;
        }

        result.server = dispatcher.dispatch(results.user.userId, connectors);
        utils.invokeCallback(callback, null, result);
      } else {
        utils.invokeCallback(callback, {}, {needSignIn: true});
      }
    }
  ], function(err, result) {
    if (!err) {
      session.set('userId', results.user.userId);
      session.set('sessionToken', results.userSession.sessionToken);
      session.bind(results.user.userId);
    }
    session.set('connAuthed', true);
    session.pushAll( function(){
      logger.info('Connection authed~', err, result);
      if (!!err && !result) {
        utils.invokeCallback(next, null, {needSignUp:true});
      } else {
        utils.invokeCallback(next, null, result);
      }
      //utils.invokeCallback(next, null, {needSignIn: true});
    });
  });


//  if (!!sessionToken && !!userId) {
//    var userSession = null;
//    var result = {};
//
//    UserSession.getByToken(sessionToken, function(err, uSession) {
//      if (!!uSession && uSession.userId == userId) {
//        session.bind(userId);
//        session.set('userId', userId);
//        session.set('sessionToken', sessionToken);
//        logger.info('user signed In: sessionToken:', sessionToken);
//        uSession.updatedAt = Date.now();
//        uSession.save();
//        sessionOk = true;
//
//        userDao.getByUserId(userId, function(err, user) {
//
//        });
//
//        result.user = user.toParams();
//        result.sessionToken = userSession.sessionToken;
//
//        var connectors = self.app.getServersByType('ddz');
//        if(!connectors || connectors.length === 0) {
//          utils.invokeCallback(next, null, {err:Code.GATE.NO_SERVER_AVAILABLE} );
//          return;
//        }
//        result.server = dispatcher.dispatch(user.userId, connectors);
//        utils.invokeCallback(next, null, result);
//
//      }
//      session.pushAll(function(){
//        logger.info('Connection authed~');
//        utils.invokeCallback(next, null, {needSignIn: !sessionOk});
//      });
//    });
//    return;
//  }
//
//  session.push('connAuthed', function(){
//    logger.info('Connection authed~');
//    utils.invokeCallback(next, null, {needSignIn: true});
//  });
};
