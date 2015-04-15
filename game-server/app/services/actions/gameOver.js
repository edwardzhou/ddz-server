/**
 * Created by edward on 13-12-9.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');
var PokeCard = require('../../domain/pokeCard');
var DdzProfile = require('../../domain/ddzProfile');
var CardUtil = require('../../util/cardUtil');
var PlayerRole = require('../../consts/consts').PlayerRole;
var PlayerState = require('../../consts/consts').PlayerState;
var Q = require('q');
var CardInfo = require('../../AI/CardInfo');
var taskService = require('../taskService');
var userService = require('../userService');
var userLevelService = require('../userLevelService');
var calcService = require('../calcService');

var calcNormalGameOverQ = Q.nbind(calcService.calcNormalGameOver, calcService);
var calcPlayerEscapeQ = Q.nbind(calcService.calcPlayerEscape, calcService);
var onUserCoinsChangedQ = Q.nbind(userLevelService.onUserCoinsChanged, userLevelService);
var doBankruptProcessQ = Q.nbind(userService.doBankruptProcess, userService);
var processGamingTasksQ = Q.nbind(taskService.processGamingTasks, taskService);

var GameOverAction = function(opts) {

};

module.exports = GameOverAction;


/**
 * 牌局结算
 * @param table - 牌桌
 * @param player - 赢家或逃跑的玩家
 * @param cb
 */
GameOverAction.doGameOver = function(table, player, cb) {
  var pokeGame = table.pokeGame;
  var gameRoom = table.room;
  var pre_p_win_coins = 0;

  Q.fcall(function() {
    // 1. 得出结算信息
    if (player.pokeCards.length == 0) {
      // 玩家手上的牌光了，表示他是赢家，进行正常结算
      return calcNormalGameOverQ(table, player);
    } else {
      // 玩家手上还有牌，即为逃跑，进行逃跑结算
      return calcPlayerEscapeQ(table, player);
    }
  })
    .then(function() {
        logger.info('GameOverAction.doGameOver, pokeGame=', pokeGame);
        logger.info('GameOverAction.doGameOver, pokeGame.playersResults=', pokeGame.playersResults);

      // 2. 更新第一位玩家的金币数
      var p = pokeGame.players[0];
      taskService.processGamingTasks(p, 'game_over', (pokeGame.playersResults[p.userId] > 0),
          pokeGame.playersResults[p.userId], (pokeGame.score.spring != 0), pokeGame, pokeGame.gameRoom);
        pre_p_win_coins = pokeGame.playersResults[p.userId];
        return DdzProfile.updateCoinsByUserIdQ(p.userId, pokeGame.playersResults[p.userId]);
    })
    .then(function(ddzProfile) {
        return doBankruptProcessQ(pokeGame.players[0].userId);
    })
      .then(function(){
        return onUserCoinsChangedQ(pokeGame.players[0].userId, pre_p_win_coins > 0);
      })
      .then(function(){
        return DdzProfile.findOneQ({userId:pokeGame.players[0].userId});
      })
      .then(function(ddzProfile){
        // 设置第一个玩家的ddzProfile
        logger.info('set 1th player ddzprofile,', ddzProfile);
        pokeGame.players[0].ddzProfile = ddzProfile;

        // 3. 更新第二位玩家的ddzProfile
        var p = pokeGame.players[1];
        //taskService.processGamingTasks(p, 'game_over', (pokeGame.playersResults[p.userId] > 0),
        //    pokeGame.playersResults[p.userId], (pokeGame.score.spring != 0), pokeGame, pokeGame.gameRoom);
        pre_p_win_coins = pokeGame.playersResults[p.userId];
        return DdzProfile.updateCoinsByUserIdQ(p.userId, pokeGame.playersResults[p.userId]);
      })
      .then(function(ddzProfile) {
        return doBankruptProcessQ(pokeGame.players[1].userId);
      })
      .then(function(){
        return onUserCoinsChangedQ(pokeGame.players[1].userId, pre_p_win_coins > 0);
      })
      .then(function(){
        return DdzProfile.findOneQ({userId:pokeGame.players[1].userId});
      })
      .then(function(ddzProfile){
        // 设置第二位玩家的ddzProfile
        logger.info('set 2th player ddzprofile,', ddzProfile);
        pokeGame.players[1].ddzProfile = ddzProfile;
        // 4. 更新第三位玩家的ddzProfile
        var p = pokeGame.players[2];
        taskService.processGamingTasks(p, 'game_over', (pokeGame.playersResults[p.userId] > 0),
            pokeGame.playersResults[p.userId], (pokeGame.score.spring != 0), pokeGame, pokeGame.gameRoom);
        pre_p_win_coins = pokeGame.playersResults[p.userId];
        return DdzProfile.updateCoinsByUserIdQ(p.userId, pokeGame.playersResults[p.userId]);
      })
      .then(function(ddzProfile) {
        return doBankruptProcessQ(pokeGame.players[2].userId);
      })
      .then(function(){
        return onUserCoinsChangedQ(pokeGame.players[2].userId, pre_p_win_coins > 0);
      })
      .then(function(){
        return DdzProfile.findOneQ({userId: pokeGame.players[2].userId});
      })
      .then(function(ddzProfile){
        // 设置第三位玩家的ddzProfile
        logger.info('set 3th player ddzprofile,', ddzProfile);
        pokeGame.players[2].ddzProfile = ddzProfile;

        // 结算结果信息存入pokeGame
        pokeGame.score.players = [];
        for (var index=0; index<pokeGame.players.length; index++) {
          var player = pokeGame.players[index];
          pokeGame.score.players.push({
            userId: player.userId,
            nickName: player.nickName,
            score: pokeGame.playersResults[player.userId],
            ddzProfile: player.ddzProfile.toParams(),
            initPokeCards: player.initPokeCards,
            pokeCards: CardUtil.pokeCardsToString(player.pokeCards)
          });

        }

        var result = pokeGame.toParams({exclude:['players', 'grabbingLord']});
        result.lordWon = pokeGame.lordWon;
        result.score = {};
        result.score.lordWon = pokeGame.lordWon? 1 : 0; // 地主赢还是输
        result.score.rake = pokeGame.score.rake;  // 佣金
        result.score.ante = pokeGame.score.ante;  // 底数
        result.score.lordValue = pokeGame.score.lordValue;  // 倍数
        result.score.bombs = pokeGame.score.bombs;  // 炸弹数
        result.score.spring = pokeGame.score.spring; // 春天反春天
        result.score.total = pokeGame.score.total; // 输赢总数
        result.score.rakedTotal = pokeGame.score.raked_total; // 扣除佣金的总数
        result.score.rakeValue = result.score.total - result.score.rakedTotal; // 佣金
        result.score.players = pokeGame.score.players.slice(0);

        utils.invokeCallback(cb, null, result.score);
      })
    .fail(function(error) {
      logger.error('[GameOverAction.doGameOver] Error: ', error);
      utils.invokeCallback(cb, null, result.score);
    });

};