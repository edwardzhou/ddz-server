var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../../../util/utils');

var UserSession = require('../../../domain/UserSession');

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

  session.set('connAuthed', true);

  var userId = msg.userId;
  var sessionToken = msg.sessionToken;
  var sessionOk = false;
  if (!!sessionToken && !!userId) {
    var userSession = null;

    UserSession.getByToken(sessionToken, function(err, uSession) {
      if (!!uSession && uSession.userId == userId) {
        session.bind(userId);
        session.set('userId', userId);
        session.set('sessionToken', sessionToken);
        logger.info('user signed In: sessionToken:', sessionToken);
        uSession.updatedAt = Date.now();
        uSession.save();
        sessionOk = true;
      }
      session.pushAll(function(){
        logger.info('Connection authed~');
        utils.invokeCallback(next, null, {needSignIn: !sessionOk});
      });
    });
    return;
  }

  session.push('connAuthed', function(){
    logger.info('Connection authed~');
    utils.invokeCallback(next, null, {needSignIn: true});
  });
};
