/**
 * Created by edwardzhou on 14-9-3.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var DdzGoods = require('../domain/ddzGoods');
var DdzUserAsset = require('../domain/ddzUserAsset');
var userService = require('../services/userService');
var userLevelService = require('../services/userLevelService');
var User = require('../domain/user');
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


/**
 * 发放道具包
 * @param purchaseOrder - 购买订单
 * @returns {Promise|*}
 */
DdzGoodsPackageService.deliverPackageQ = function(purchaseOrder) {
  var user = null;
  var coinsChanged = false;
  var coinsUp = 1;
  // 获取订单的用户
  return User.findOne({userId: purchaseOrder.userId})
    .populate('ddzProfile') // 加载ddzProfile
    .execQ()
    .then(function(u) {
      user = u;
      // 对每个道具项发放
      var items = purchaseOrder.packageData.items;
        var old_coins = user.ddzProfile.coins;
      for (index=0; index<items.length; index++) {
        var item = items[index];
        DdzGoodsPackageService['do' + item.goods.goodsAction](user, item);
      }
      if (old_coins != user.ddzProfile.coins){
        coinsChanged = true;
        if (old_coins < user.ddzProfile.coins){
          coinsUp = false;
        }
      }

      // 保存ddzProfile
      return user.ddzProfile.saveQ();
    })
    .then(function() {
      if (coinsChanged){
        userLevelService.onUserCoinsChanged(user.userId, coinsUp);
      }

      // 标记订单已处理
      purchaseOrder.status = 1;
      return purchaseOrder.saveQ();
    })
    .then(function(po) {
      // 最后，放回用户
      return user;
    });
};

/**
 * 充值类道具项处理
 * @param user - 用户
 * @param goodsItem - 道具项
 */
DdzGoodsPackageService.doIncreaseCoins = function(user, goodsItem) {
  // 加金币
  user.ddzProfile.coins += goodsItem.goods.goodsProps.coins * goodsItem.goodsCount;
  //user.ddzProfile.levelName = pomeloApp.rpc.userSystem.userRemote.getUserLevelName(user.ddzProfile.coins);
};

/**
 * 使用类道具项处理
 * @param user
 * @param goodsItem
 */
DdzGoodsPackageService.doAddToAsset = function(user, goodsItem) {

  for (var i=0; i<goodsItem.goodsCount; i++) {
    var newAsset = new DdzUserAsset({
      userId: user.userId,
      goodsId: goodsItem.goods.goodsId,
      goodsName: goodsItem.goods.goodsName,
      goodsDesc: goodsItem.goods.goodsDesc,
      goodsType: goodsItem.goods.goodsType,
      goodsAction: goodsItem.goods.goodsAction,
      goodsIcon: goodsItem.goods.goodsIcon,
      goodsProps: goodsItem.goods.goodsProps,
      sortIndex: goodsItem.goods.sortIndex,
      used_at: null
    });
    newAsset.saveQ()
        .then(function(asset) {
          logger.info('[DdzGoodsPackageService.doAddToAsset] add asset "%s" to user "%d" successfully:',
              asset.goodsId, user.userId, asset );
        })
        .fail(function(err) {
          logger.error('[DdzGoodsPackageService.doAddToAsset] Error: ', err);
        });
  }
};

DdzGoodsPackageService.doAddTaskGoodToAsset = function(user, goodsId, count) {
  DdzGoods.findOneQ({id: goodsId})
      .then(function(goods){
        for (var i=0; i<count; i++) {
          var newAsset = new DdzUserAsset({
            userId: user.userId,
            goodsId: goods.goodsId,
            goodsName: goods.goodsName,
            goodsDesc: goods.goodsDesc,
            goodsType: goods.goodsType,
            goodsAction: goods.goodsAction,
            goodsIcon: goods.goodsIcon,
            goodsProps: goods.goodsProps,
            sortIndex: goods.sortIndex,
            used_at: null
          });
          newAsset.save();
        }
        logger.info('DdzGoodsPackageService.doAddTaskGoodToAsset done.');
      })
      .fail(function(error){
        logger.error('DdzGoodsPackageService.doAddTaskGoodToAsset failed.',error);
      });

};