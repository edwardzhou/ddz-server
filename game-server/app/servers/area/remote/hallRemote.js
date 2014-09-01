/**
 * Created by edwardzhou on 14-9-1.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var UserSession = require('../../../domain/userSession');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');
var DdzGoods = require('../../../domain/ddzGoods');
var format = require('util').format;
var utils = require('../../../util/utils');
var ErrorCode = require('../../../consts/errorCode');

var _goodsPackages = null;

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
  _goodsMap = {};
  var goodsPkgs = [];

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
        _goodsPackages.push(goodsPackage.toParams());

      }
    })
    .fail(function(error) {
      console.error(error);
    });

};

remoteHandler.getGoodsPackages = function(uid, frontendId, sessionId, cb) {
  utils.invokeCallback(cb, null, _goodsPackages);
};