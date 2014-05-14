/**
 * Created by edwardzhou on 13-12-18.
 */

/**
 * Filter for toobusy.
 * if the process is toobusy, just skip the new request
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');

var defaultSignInUpRegExpr = new RegExp("\\.((authConn)|(signIn)|(signUp))$");
var defaultUserIdSessionKey = 'userId';

module.exports = function(opts) {
  return new Filter(opts);
};

var Filter = function(opts) {
  opts = opts || {};
//  opts.signMethods = opts.signMethods || [];
//  opts.signMethods.push('\\.authConn');
  if (!!opts.signMethods) {
    for (var index in opts.signMethods) {
      opts.signMethods[index] = '(' + opts.signMethods + ')';
    }
    var expr = '\\.(' + opts.signMethods.join('|') + ')$';
    logger.info('[SignInUpFilter] expr => ', expr);
    this.signRegExpr = new RegExp(expr);
  } else {
    this.signRegExpr = defaultSignInUpRegExpr;
  }

  this.userIdSessionKey = opts.userIdSessionKey || defaultUserIdSessionKey;
};

Filter.prototype.before = function(msg, session, next) {
  var sid = session.id;

  if (!session.get(this.userIdSessionKey)) {
    if (! this.signRegExpr.test(msg.__route__)) {
      logger.warn('[SignInUpFilter] reject request msg: ' , msg);
      var err = new Error('Not signed yet!');
      err.code = ErrorCode.CLIENT_NOT_SIGNED_YET;
      next(err, {err: err});

      utils.kickBySession(session);
      return;
    }
  }

  next();
};

