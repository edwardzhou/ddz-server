/**
 * Created by edwardzhou on 14-9-1.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var UserSession = require('../../../domain/userSession');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');
var DdzGoods = require('../../../domain/ddzGoods');
var PurchaseOrder = require('../../../domain/purchaseOrder');
var format = require('util').format;
var utils = require('../../../util/utils');
var ErrorCode = require('../../../consts/errorCode');

var _goodsPackages = [];
var _goodsPackagesMap = {};

module.exports = function(app) {
  return new HallRemote(app);
};

var HallRemote = function(app) {
  this.app = app;
  // this.tableService = app.get('tableService');
//  this.channelService = app.get('channelService');
//  this.sessionService = app.get('localSessionService');

  this.refreshGoodsPackages();
};

var remoteHandler = HallRemote.prototype;

remoteHandler.refreshGoodsPackages = function(cb) {
  _goodsPackages = [];
  _goodsPackagesMap = {};
  _goodsMap = {};
  //var goodsPkgs = [];

  DdzGoods.findQ({})
    .then(function(ddzGoods) {
      for (var index=0; index<ddzGoods.length; index++) {
        var goods = ddzGoods[index];
        _goodsMap[goods.id] = goods;
      }

      return DdzGoodsPackage.getGoodsPackagesQ();
    })
    .then(function(packages) {

      for (var index=0; index<packages.length; index++) {
        var goodsPackage = packages[index];
        for (var itemIndex=0; itemIndex<goodsPackage.items.length; itemIndex++) {
          var goodsItem = goodsPackage.items[itemIndex];
          goodsItem.goods = _goodsMap[goodsItem.goodsId];
        }
        _goodsPackagesMap[goodsPackage.packageId] = goodsPackage;
        _goodsPackages.push(goodsPackage.toParams(['items']));

      }
    })
    .fail(function(error) {
      console.error(error);

    });

};

remoteHandler.getGoodsPackages = function(uid, frontendId, sessionId, cb) {
  utils.invokeCallback(cb, null, _goodsPackages);
};

remoteHandler.buyPackage = function(msg, cb) {
  var frontendId = msg.frontendId;
  var sessionId = msg.sessionId;
  var userId = msg.uid;
  var packageId = msg.pkgId;

  var package = _goodsPackagesMap[packageId];

  PurchaseOrder.createOrderQ(userId, package, null, 1000)
    .then(function(po) {
      utils.invokeCallback(cb, null, po.toParams());
    })
    .fail(function(error) {
      logger.error('[HallRemote.buyPackage] error: ', error)
      utils.invokeCallback(cb, error, null);
    });
};
