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

var GameOverAction = function(opts) {

};

module.exports = GameOverAction;

/**
 * 逃跑结算
 * @param table - 牌桌
 * @param player - 逃跑玩家
 */
var calcPlayerEscape = function(table, player) {
    var result = {ddzProfiles: {}};
    var pokeGame = table.pokeGame;
    var player1 = pokeGame.getNextPlayer(player.userId);
    var player2 = pokeGame.getNextPlayer(player1.userId);

    var player = result.player;
    var player1 = result.player1;
    var player2 = result.player2;
    var pokeGame = result.pokeGame;

    DdzProfile.findOneQ({userId: player.userId})
        .then(function(ddzProfile){
            result.ddzProfiles[player.userId] = ddzProfile;
            return DdzProfile.findOneQ({userId: player1.userId});
        })
        .then(function(ddzProfile){
            result.ddzProfiles[player1.userId] = ddzProfile;
            return DdzProfile.findOneQ({userId: player2.userId});
        })
        .then(function(ddzProfile) {
            result.ddzProfiles[player2.userId] = ddzProfile;

            if (player.role == PlayerRole.NONE) {
                player.role = PlayerRole.LORD;
            }

            if (!pokeGame.lordValue || pokeGame.lordValue < 1) {
                if (!!pokeGame.grabbingLord.lordValue && pokeGame.grabbingLord.lordValue > 0) {
                    pokeGame.lordValue = pokeGame.grabbingLord.lordValue;
                } else {
                    pokeGame.lordValue = 1;
                }
            }

            var cardInfo;
            cardInfo = CardInfo.create(PokeCard.pokeCardsFromChars(player.initPokeCards));
            pokeGame.lordValue <<= cardInfo.bombs.length + cardInfo.rockets.length;

            cardInfo = CardInfo.create(PokeCard.pokeCardsFromChars(player1.initPokeCards));
            pokeGame.lordValue <<= cardInfo.bombs.length + cardInfo.rockets.length;

            cardInfo = CardInfo.create(PokeCard.pokeCardsFromChars(player2.initPokeCards));
            pokeGame.lordValue <<= cardInfo.bombs.length + cardInfo.rockets.length;

            // 如果未产生地主，则逃跑的player为地主，
            if (pokeGame.lordUserId <= 0) {
                player.role = PlayerRole.LORD;
            }

            if (player.isLord()) {
                // 如果只出过一手牌以下，判为反春
                if (!player.plays || player.plays <= 1) {
                    pokeGame.score.spring = -1;
                    pokeGame.lordValue *= 2;
                }
                pokeGame.lordWon = false;

            } else {
                var farmerUser = null;
                if (!player1.isLord()) {
                    farmerUser = player1;
                } else {
                    farmerUser = player2;
                }
                if ( (!farmerUser.plays || farmerUser.plays <=0) && (!player.plays || player.plays <=0) ) {
                    // 两农民都未出过牌，判春天
                    pokeGame.score.spring = 1;
                    pokeGame.lordValue <<= 1;
                }
                pokeGame.lordWon = true;
            }

            pokeGame.escapeUserId = player.userId;

            var score = pokeGame.score;
            score.rake = pokeGame.gameRake;
            score.ante = pokeGame.gameAnte;
            score.lordValue = pokeGame.lordValue;
            score.total = score.ante * score.lordValue;
            if (score.rake >= 1) {
                score.raked_total = score.total - score.rake;
            } else if (score.rake > 0) {
                score.raked_total = score.total * (1 - score.rake);
            }

            pokeGame.playersResults = {};

            score.players = [];
            calcGameOver(result);

        });

};

/**
 * 正常结算
 * @param table - 牌桌
 * @param player - 赢家
 */
var calcNormalGameOver = function(table, player) {
    var result = {ddzProfiles: {}};

    var pokeGame = table.pokeGame;
    var player1 = pokeGame.getNextPlayer(player.userId);
    var player2 = pokeGame.getNextPlayer(player1.userId);

    result.player = player;
    result.player1 = player1;
    result.player2 = player2;
    result.pokeGame = pokeGame;

    DdzProfile.findOneQ({userId: player.userId})
        .then(function(ddzProfile){
            result.ddzProfiles[player.userId] = ddzProfile;
            return DdzProfile.findOneQ({userId: player1.userId});
        })
        .then(function(ddzProfile){
            result.ddzProfiles[player1.userId] = ddzProfile;
            return DdzProfile.findOneQ({userId: player2.userId});
        })
        .then(function(ddzProfile){
            result.ddzProfiles[player2.userId] = ddzProfile;

            pokeGame.lordWon = false;

            if (player.isLord()) {
                // 两家农民都没有出过牌,春天
                if (player1.plays == 0 && player2.plays ==0) {
                    pokeGame.score.spring = 1;
                    pokeGame.lordValue *= 2;
                }
                pokeGame.lordWon = true;
            } else {
                var lord = player1.isLord()? player1 : player2;
                // 如果地主只出过一手牌,反春天
                if (lord.plays == 1) {
                    pokeGame.score.spring = -1;
                    pokeGame.lordValue *= 2;
                }
            }

            pokeGame.playersResults = {};

            var score = pokeGame.score;
            score.rake = pokeGame.gameRake;
            score.ante = pokeGame.gameAnte;
            score.lordValue = pokeGame.lordValue;
            score.total = score.ante * score.lordValue * Math.pow(2, Math.abs(score.spring));
            if (score.rake >= 1) {
                score.raked_total = score.total - score.rake;
            } else if (score.rake > 0) {
                score.raked_total = score.total * (1 - score.rake);
            }

            score.players = [];
            calcGameOver(result);
        });

};

var calcGameOver = function(calcResult){
    var result = calcResult;
    var player = result.player;
    var player1 = result.player1;
    var player2 = result.player2;
    var pokeGame = result.pokeGame;
    if (player.isLord()) {

        var real_win_total = score.raked_total;
        if (result.ddProfiles[player.userId].coins < score.raked_total){
            real_win_total = result.ddProfiles[player.userId].coins;
        }
        pokeGame.playersResults[player.userId] = real_win_total;
        var plan_farmer_lose = real_win_total / 2;

        var max_farmer_userId = player1.userId;
        var min_farmer_userId = player2.userId;
        if (result.ddzProfiles[player1.userId].coins > result.ddzProfiles[player2.userId].coins){
            max_farmer_userId = player2.userId;
            min_farmer_userId = player1.userId;
        }
        if (result.ddzProfiles[min_farmer_userId].coins < plan_farmer_lose){
            pokeGame.playersResults[min_farmer_userId] = -1 * result.ddzProfiles[min_farmer_userId].coins;
            var max_farmer_lose = (2 * plan_farmer_lose) - result.ddzProfiles[min_farmer_userId].coins;
            if (max_farmer_lose > (score.raked_total / 2)){
                max_farmer_lose = score.raked_total / 2;
            }
            if (max_farmer_lose > result.ddzProfiles[max_farmer_userId].coins){
                max_farmer_lose = -result.ddzProfiles[max_farmer_userId].coins;
            }
            pokeGame.playersResults[max_farmer_userId] = -1 * max_farmer_lose;
        }
        else {
            pokeGame.playersResults[player1.userId] = -1 * plan_farmer_lose;
            pokeGame.playersResults[player2.userId] = -1 * plan_farmer_lose;
        }

    } else {
        var lordUser, farmerUser;
        if (player1.isLord()) {
            lordUser = player1;
            farmerUser = player2;
        } else {
            lordUser = player2;
            farmerUser = player1;
        }
        var winScore = Math.round(score.raked_total / 2)

        pokeGame.playersResults[lordUser.userId] = -1 * score.total;
        pokeGame.playersResults[player.userId] = winScore;
        pokeGame.playersResults[farmerUser.userId] = winScore;

        var real_lord_lose = score.total;
        if (result.ddzProfiles[lordUser.userId].coins < real_lord_lose){
            real_lord_lose = result.ddzProfiles[lordUser.userId].coins;
        }
        pokeGame.playersResults[lordUser.userId] = -1 * real_lord_lose;

        var max_farmer_userId = player.userId;
        var min_farmer_userId = farmerUser.userId;
        if (result.ddzProfiles[farmerUser.userId].coins > result.ddzProfiles[player.userId].coins){
            max_farmer_userId = farmerUser.userId;
            min_farmer_userId = player.userId;
        }
        var plan_farmer_win = real_lord_lose / 2;
        if (result.ddzProfiles[min_farmer_userId].coins < plan_farmer_win){
            pokeGame.playersResults[min_farmer_userId] = result.ddzProfiles[min_farmer_userId].coins;
            var max_farmer_win = 2 * plan_farmer_win - result.ddzProfiles[min_farmer_userId].coins;
            if (max_farmer_win > winScore){
                max_farmer_win = winScore;
            }
            if (max_farmer_win > result.ddzProfiles[max_farmer_userId].coins){
                max_farmer_win = result.ddzProfiles[max_farmer_userId].coins;
            }
            pokeGame.playersResults[min_farmer_userId] = max_farmer_win;
        }
        else {
            pokeGame.playersResults[player.userId] = plan_farmer_win;
            pokeGame.playersResults[farmerUser.userId] = plan_farmer_win;
        }
    }
};

/**
 * 牌局结算
 * @param table - 牌桌
 * @param player - 赢家或逃跑的玩家
 * @param cb
 */
GameOverAction.doGameOver = function(table, player, cb) {
  var pokeGame = table.pokeGame;
  var pre_p_win_coins = 0;
  Q.fcall(function() {
    // 1. 得出结算信息
    if (player.pokeCards.length == 0) {
      // 玩家手上的牌光了，表示他是赢家，进行正常结算
      calcNormalGameOver(table, player);
    } else {
      // 玩家手上还有牌，即为逃跑，进行逃跑结算
      calcPlayerEscape(table, player);
    }
  })
    .then(function() {
      // 2. 更新第一位玩家的金币数
      var p = pokeGame.players[0];
      taskService.processGamingTasks(p, 'game_over', (pokeGame.playersResults[p.userId] > 0),
          pokeGame.playersResults[p.userId], (pokeGame.score.spring != 0), pokeGame, pokeGame.gameRoom);
      pre_p_win_coins = pokeGame.playersResults[p.userId];
      return DdzProfile.updateCoinsByUserIdQ(p.userId, pokeGame.playersResults[p.userId]);
    })
    .then(function(ddzProfile) {
      // 设置第一个玩家的ddzProfile
        logger.info('set 1th player ddzprofile,', ddzProfile);
        userLevelService.onUserCoinsChanged(pokeGame.players[0].userId, pre_p_win_coins > 0);
      userService.doBankruptProcess(pokeGame.players[0].userId);
      pokeGame.players[0].ddzProfile = ddzProfile;

      // 3. 更新第二位玩家的ddzProfile
      var p = pokeGame.players[1];
      taskService.processGamingTasks(p, 'game_over', (pokeGame.playersResults[p.userId] > 0),
          pokeGame.playersResults[p.userId], (pokeGame.score.spring != 0), pokeGame, pokeGame.gameRoom);
      pre_p_win_coins = pokeGame.playersResults[p.userId];
      return DdzProfile.updateCoinsByUserIdQ(p.userId, pokeGame.playersResults[p.userId]);
    })
    .then(function(ddzProfile) {
      // 设置第二位玩家的ddzProfile
        logger.info('set 2th player ddzprofile,', ddzProfile);
        userLevelService.onUserCoinsChanged(pokeGame.players[1].userId, pre_p_win_coins > 0);
      userService.doBankruptProcess(pokeGame.players[1].userId);
      pokeGame.players[1].ddzProfile = ddzProfile;

      // 4. 更新第三位玩家的ddzProfile
      var p = pokeGame.players[2];
      taskService.processGamingTasks(p, 'game_over', (pokeGame.playersResults[p.userId] > 0),
          pokeGame.playersResults[p.userId], (pokeGame.score.spring != 0), pokeGame, pokeGame.gameRoom);
      pre_p_win_coins = pokeGame.playersResults[p.userId];
      return DdzProfile.updateCoinsByUserIdQ(p.userId, pokeGame.playersResults[p.userId]);
    })
    .then(function(ddzProfile) {
      // 设置第三位玩家的ddzProfile
        logger.info('set 3th player ddzprofile,', ddzProfile);
        userLevelService.onUserCoinsChanged(pokeGame.players[2].userId, pre_p_win_coins > 0);
      userService.doBankruptProcess(pokeGame.players[2].userId);
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

      var result = pokeGame.toParams(['players', 'grabbingLord']);
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