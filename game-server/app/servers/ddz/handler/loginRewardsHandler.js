/**
 * Created by edwardzhou on 15/2/13.
 */
var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var messageService = require('../../../services/messageService');
var userService = require('../../../services/userService');

var deliverLoginRewardQ = Q.nbind(userService.deliverLoginReward, userService);


module.exports = function (app) {
  return new Handler(app);
};

var Handler = function (app) {
  logger.info("connector.LoginRewardsHandler created.");
  this.app = app;
};


/**
 * 获取每日登录奖励
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.queryLoginRewards = function (msg, session, next) {
  var userId = session.uid;
  User.findOne({userId: userId})
    .populate('ddzLoginRewards')
    .execQ()
    .then(function(user) {
      logger.info('[loginRewardsHandler.queryLoginRewards] user => ', user);
      utils.invokeCallback(next, null, {ddzLoginRewards: user.ddzLoginRewards.toParams()});
    })
    .fail(function(err) {
      logger.error('[loginRewardsHandler.queryLoginRewards] error => ', err);
      utils.invokeCallback(next, null, {ddzLoginRewards: null, err: err});
    });
};


/**
 * 领取每日登录奖励
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.takeLoginRewards = function(msg, session, next) {
  var userId = session.uid;
  deliverLoginRewardQ(userId)
    .then(function(result) {
      utils.invokeCallback(next, null, {result: true, coins: result.rewardCoins});
    })
    .fail(function(error) {
      logger.error('[loginRewardsHandler.takeLoginRewards] error => ', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    })
};