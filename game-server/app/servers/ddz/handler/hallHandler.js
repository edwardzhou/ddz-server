/**
 * Created by edwardzhou on 14-9-1.
 */
var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var DdzUserAsset = require('../../../domain/ddzUserAsset');
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

Handler.prototype.getAssetItems = function(msg, session, next) {
  var userId = session.uid;
  User.findOneQ({userId: userId})
    .then(function(user) {
      var now = Date.now();
      return DdzUserAsset.findQ({user_id: user.id, $or: [{expired_at: null}, {expired_at: {$gt: now}}] });
    })
    .then(function(userAssets) {

      var assetsMap = {};
      var asset;
      for (var i=0; i< userAssets.length; i++) {
        asset = userAssets[i];
        if (!!assetsMap[asset.goodsId]) {
          assetsMap[asset.goodsId].count = assetsMap[asset.goodsId].count + 1;
        } else {
          asset.count = 1;
          assetsMap[asset.goodsId] = asset;
        }
      }

      var reducedAssets = [];
      for (var key in assetsMap) {
        reducedAssets.push(assetsMap[key]);
      }

      utils.invokeCallback(next, null, {assets: reducedAssets.toParams()});
    })
    .fail(function(err){
      logger.error('[HallHandler.getAssetItems] Error: ', err);
      utils.invokeCallback(next, null, {error: 500});
    });
};

Handler.prototype.useAssetItem = function(msg, session, next) {
  var userId = session.uid;
  var assetId = msg.assetId;
  var user = null;
  var ddzUserAsset = null;

  User.findOneQ({userId: userId})
    .then(function(_user) {
      user = _user;
      return DdzUserAsset.findQ({id: assetId});
    })
    .then(function(_asset) {
      ddzUserAsset = _asset;

      if (ddzUserAsset.user_id != user.id) {
        throw new Error("道具不属于该用户", 5001);
      }

      ddzUserAsset.used_at = Date.now();
      var duration = ddzUserAsset.goodsProps.duration;
      var unit = duration[duration.length-1];
      var elapsed = parseInt(duration) * 1000; // default seconds
      if (unit == 'd') {
        elapsed = elapsed * 24 * 60 * 60; // 1d = 24h x 60min x 60sec
      } else if (unit == 'h') {
        elapsed = elapsed * 60 * 60; // 1h = 60min x 60sec
      } else if (unit == 'm') {
        elapsed = elapsed * 60; // 1min = 60sec
      }

      ddzUserAsset.expired_at = new Date(ddzUserAsset.used_at + elapsed);
      return ddzUserAsset.saveQ();
    })
    .then(function() {
      utils.invokeCallback(next, null, new Result(0) )
    })
    .fail(function(err) {
      logger.error('[HallHandler.useAssetItem] Error: ', err);
      var result = new Result(1000, 0, err.toString());
      utils.invokeCallback(next, null, result);
    });

};