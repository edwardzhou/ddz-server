/**
 * Created by edwardzhou on 14-9-1.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var UserSession = require('../../../domain/userSession');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');
var DdzGoods = require('../../../domain/ddzGoods');
var PurchaseOrder = require('../../../domain/purchaseOrder');
var PackagePayment = require('../../../domain/packagePayment');
var PaymentMethod = require('../../../domain/paymentMethod');
var Channel = require('../../../domain/channel');
var format = require('util').format;
var utils = require('../../../util/utils');
var ErrorCode = require('../../../consts/errorCode');
var Q = require('q');

//var _goodsPackages = [];
//var _goodsPackagesMap = {};
//var _packagesIdMap = {};
//var _channelsMap = {};
//var _paymentMethodsMap = {};
//var _paymentPackagesMap = {};
//var _channelPackagesMaps = {};

var cache = {
  goodsPackages: [],
  goodsPackagesMap: {},
  packagesIdMap: {},
  channelsMap: {},
  paymentMethodsMap: {},
  paymentPackagesMap: {},
  channelPackagesMaps: {}
};

var http = require('http');
var util = require('util');

module.exports = function(app) {
  return new HallRemote(app);
};

module.exports.cache = cache;

var HallRemote = function(app) {
  this.app = app;
  // this.tableService = app.get('tableService');
//  this.channelService = app.get('channelService');
//  this.sessionService = app.get('localSessionService');

  this.refreshGoodsPackages();
};

var remoteHandler = HallRemote.prototype;

remoteHandler.refreshGoodsPackages = function(cb) {
  cache.goodsPackages = [];
  cache.goodsPackagesMap = {};
  cache.packagesIdMap = {};
  cache.goodsMap = {};
  cache.channelsMap = {};
  cache.paymentMethodsMap = {};
  cache.paymentPackagesMap = {};
  //var goodsPkgs = [];
  var _channels = [];

  // 加载具体商品
  DdzGoods.findQ({})
    .then(function(ddzGoods) {
      // 生成商品字典
      for (var index=0; index<ddzGoods.length; index++) {
        var goods = ddzGoods[index];
        cache.goodsMap[goods.id] = goods;
      }

      // 加载道具包
      return DdzGoodsPackage.getGoodsPackagesQ();
    })
    .then(function(packages) {
      // 生成道具包字典
      for (var index=0; index<packages.length; index++) {
        var goodsPackage = packages[index];
        for (var itemIndex=0; itemIndex<goodsPackage.items.length; itemIndex++) {
          var goodsItem = goodsPackage.items[itemIndex];
          goodsItem.goods = cache.goodsMap[goodsItem.goodsId];
        }
        cache.goodsPackagesMap[goodsPackage.packageId] = goodsPackage;
        cache.packagesIdMap[goodsPackage.id] = goodsPackage;
        cache.goodsPackages.push(goodsPackage.toParams(['items']));
      }

      // 加载 渠道
      return Channel.getEnabledChannelsQ();
    })
    .then(function(channels) {
      // 生成渠道字典
      _channels = channels;
      channels.forEach(function(channel) {
        cache.channelsMap[channel.id] = channel.toParams();
      });

      // 加载支付方式
      return PaymentMethod.findQ({enabled: true});
    })
    .then(function(paymentMethods) {
      // 生成支付方式字典
      var pps = paymentMethods.map(function(pm) {
        cache.paymentMethodsMap[pm.id] = pm.toParams();
        // 加载支付方式支持的道具包配置
        return pm.getPackagePaymentsQ(false, true);
      });
      return Q.all(pps);
    })
    .then(function(ppsArray) {
      // 生成支付方式道具包字典
      ppsArray.forEach(function(pps) {
        if (pps.length > 0) {
          var theItems = cache.paymentPackagesMap[pps[0].paymentMethod] = [];
          pps.forEach(function(pp) {
            var thePP = pp.toParams();
            thePP.package = cache.packagesIdMap[pp.package];
            PackagePayment.fixAttributes(thePP);
            theItems.push(thePP);
          });
        }
      })
    })
    .then(function(){
      _channels.forEach(function(channel) {
        cache.channelPackagesMaps[channel.channelId] = cache.paymentPackagesMap[channel.paymentMethod.id];
      });
    })
    .fail(function(error) {
      console.error(error);
    });
};

remoteHandler.getGoodsPackages = function(uid, frontendId, sessionId, cb) {
  utils.invokeCallback(cb, null, cache.goodsPackages);
};

remoteHandler.buyPackage = function(msg, cb) {
  var frontendId = msg.frontendId;
  var sessionId = msg.sessionId;
  var userId = msg.uid;
  var packageId = msg.pkgId;

  var package = cache.goodsPackagesMap[packageId];

  PurchaseOrder.createOrderQ(userId, package, null, 1000)
    .then(function(po) {
      utils.invokeCallback(cb, null, po.toParams());
      setTimeout(function() {
        var url = util.format("http://charge-server:8001/dummy?orderId=%s", po.orderId);
        http.get(url);
      }, 2000);
    })
    .fail(function(error) {
      logger.error('[HallRemote.buyPackage] error: ', error);
      utils.invokeCallback(cb, error, null);
    });
};
