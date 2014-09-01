/**
 * Created by edwardzhou on 14-9-1.
 */
var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');

var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');


module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.HallHandler created.");
  this.app = app;
};

Handler.prototype.getShopItems = function(msg, session, next) {
  DdzGoodsPackage.getGoodsPackagesQ().then(function(packages) {
    utils.invokeCallback(next, null, packages);
  });
};