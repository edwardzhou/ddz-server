/**
 * Created by edwardzhou on 14-9-3.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var DdzGoods = require('../domain/ddzGoods');
var pomeloApp = null;
var DdzGoodsPackageService = module.exports;

var _goodsMap = {};

DdzGoodsPackageService.init = function(app, opts) {
  pomeloApp = app;

  DdzGoods.findQ({})
    .then(function(goodz) {
      for (var index=0; index<goodz.length; index++) {
        _goodsMap[goodz[index].id] = goodz[index];
      }
    });

};

DdzGoodsPackageService.deliverPackageQ = function(purchaseOrder) {
  var user = null;
  return User.findOne({userId: purchaseOrder.userId})
    .populate('ddzProfile')
    .execQ()
    .then(function(u) {
      user = u;
      var items = purchaseOrder.packageData.items;
      for (index=0; index<items.length; index++) {
        var item = items[index];
        DdzGoodsPackageService['do' + item.goods.goodsType](user, item);
      }
      return user.ddzProfile.saveQ();
    })
    .then(function() {
      return user;
    });
};

DdzGoodsPackageService.doIncreaseCoins = function(user, goodsItem) {
  for (var i=0; i<goodsItem.goodsCount; i++) {
    user.ddzProfile.coins += goodsItem.goods.goodsProps.coins;
  }
};