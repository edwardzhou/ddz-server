/**
 * Created by edwardzhou on 14-9-1.
 */
var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');


module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.HallHandler created.");
  this.app = app;
};

Handler.prototype.getShopItems = function(msg, session, next) {
  var channelId = session.get('channelId');
  this.app.rpc.area.hallRemote.getGoodsPackages.toServer('room-server', session.uid, channelId, null, null, function(err, packages) {
    logger.info('[Handler.prototype.getShopItems] hallRemote.getGoodsPackages =>', packages);
    utils.invokeCallback(next, null, packages);
//    utils.invokeCallback(next, null, JSON.stringify(packages));
//    next(null, {result: 'ok'});
  });
};

Handler.prototype.buyItem = function(msg, session, next) {
  msg.uid = session.uid;
  msg.channelId = session.get('channelId');

  this.app.rpc.area.hallRemote.buyPackage.toServer('room-server', msg, function(err, pkg) {
    var result;
    if (!err) {
      result = new Result(0);
      result.pkg = pkg;
    } else {
      result = new Result(1000, 0, err.toString());
    }
    utils.invokeCallback(next, null, result);
  });
};