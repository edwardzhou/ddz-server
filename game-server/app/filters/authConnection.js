/**
 * Created by edwardzhou on 13-12-18.
 */

/**
 * Filter for toobusy.
 * if the process is toobusy, just skip the new request
 */
var con_logger = require('pomelo-logger').getLogger('con-log', __filename);

var defaultAuthRegExpr = new RegExp("\\.authConn$");
var defaultAuthSessionKey = 'connAuthed';

module.exports = function(opts) {
  return new Filter(opts);
};

var Filter = function(opts) {
  opts = opts || {};
  if (!!opts.authMethod) {
    this.authRegExpr = new RegExp('\\.' + opts.authMethod + '$');
  } else {
    this.authRegExpr = defaultAuthRegExpr;
  }

  this.authSessionKey = opts.authSessionKey || defaultAuthSessionKey;
};

Filter.prototype.before = function(msg, session, next) {
  if (session.get(this.authSessionKey) != true) {
    if (! this.authRegExpr.test(msg.__route__)) {
      con_logger.warn('[AuthConnection] reject request msg: ' , msg);
      var err = new Error('Connection not authenticated!');
      err.code = 510;
      next(err, {err: err});
      session.__session__.closed('Connection not yet authenticated!');
      return;
    }
  }
  next();
};

