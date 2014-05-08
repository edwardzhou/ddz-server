var logger = require('pomelo-logger').getLogger('pomelo', __filename);
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

Handler.prototype.authConn = function(msg, session, next) {
  session.set('connAuthed', true);
  session.push('connAuthed');
  logger.info('Connection authed~');
  next(null, {});
};
