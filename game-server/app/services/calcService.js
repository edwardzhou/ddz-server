/**
 * Created by jeffcao on 15/3/17.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../util/utils');
var PokeCard = require('../domain/pokeCard');
var DdzProfile = require('../domain/ddzProfile');
var CardUtil = require('../util/cardUtil');
var PlayerRole = require('../consts/consts').PlayerRole;
var PlayerState = require('../consts/consts').PlayerState;
var Q = require('q');
var CardInfo = require('../AI/CardInfo');
var userService = require('./userService');

var pomeloApp = null;
var CalcService = module.exports;

CalcService.init = function(app, opts) {
    pomeloApp = app;
};

var genError = function (errCode) {
    var error = new Error();
    error.errCode = errCode;
    return error;
};


/**
 * 逃跑结算
 * @param table - 牌桌
 * @param player - 逃跑玩家
 */
CalcService.calcPlayerEscape = function(table, player, cb) {
    logger.info('CalcService.calcPlayerEscape');
    var result = {ddzProfiles: {}};
    var pokeGame = table.pokeGame;
    var player1 = pokeGame.getNextPlayer(player.userId);
    var player2 = pokeGame.getNextPlayer(player1.userId);

    DdzProfile.findOneQ({userId: player.userId})
        .then(function(ddzProfile){
            result.ddzProfiles[player.userId] = ddzProfile;
            logger.info('CalcService.calcPlayerEscape, set player.ddzProfile=');
            return DdzProfile.findOneQ({userId: player1.userId});
        })
        .then(function(ddzProfile){
            result.ddzProfiles[player1.userId] = ddzProfile;
            logger.info('CalcService.calcPlayerEscape, set player1.ddzProfile=');
            return DdzProfile.findOneQ({userId: player2.userId});
        })
        .then(function(ddzProfile) {
            result.ddzProfiles[player2.userId] = ddzProfile;
            logger.info('CalcService.calcPlayerEscape, set player2.ddzProfile=');
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

            score.players = [];

            result.player = player;
            result.player1 = player1;
            result.player2 = player2;
            result.pokeGame = pokeGame;
            result.isEscape = true;
            CalcService.calcGameOver(result);
            utils.invokeCallback(cb, null, result);
        })
        .fail(function(error) {
            logger.error('[CalcService.calcPlayerEscape] Error: ', error);
            utils.invokeCallback(cb, null, error);
        });

};

/**
 * 正常结算
 * @param table - 牌桌
 * @param player - 赢家
 */
CalcService.calcNormalGameOver = function(table, player, cb) {
    logger.info('CalcService.calcNormalGameOver');
    var result = {ddzProfiles: {}};

    var pokeGame = table.pokeGame;
    var player1 = pokeGame.getNextPlayer(player.userId);
    var player2 = pokeGame.getNextPlayer(player1.userId);

    DdzProfile.findOneQ({userId: player.userId})
        .then(function(ddzProfile){
            result.ddzProfiles[player.userId] = ddzProfile;
            logger.info('CalcService.calcNormalGameOver, set player.ddzProfile=');
            return DdzProfile.findOneQ({userId: player1.userId});
        })
        .then(function(ddzProfile){
            result.ddzProfiles[player1.userId] = ddzProfile;
            logger.info('CalcService.calcNormalGameOver, set player1.ddzProfile=');
            return DdzProfile.findOneQ({userId: player2.userId});
        })
        .then(function(ddzProfile) {
            result.ddzProfiles[player2.userId] = ddzProfile;
            logger.info('CalcService.calcNormalGameOver, set player2.ddzProfile=');

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
            result.player = player;
            result.player1 = player1;
            result.player2 = player2;
            result.pokeGame = pokeGame;
            result.isEscape = false;

            CalcService.calcGameOver(result);
            utils.invokeCallback(cb, null, result);
        })
        .fail(function(error) {
            logger.error('[CalcService.calcNormalGameOver] Error: ', error);
            utils.invokeCallback(cb, null, error);
        });

};

CalcService.calcGameOver = function(calcResult){
    logger.info('CalcService.calcGameOver');
    var result = calcResult;
    var player = result.player;
    var player1 = result.player1;
    var player2 = result.player2;
    var pokeGame = result.pokeGame;
    var isEscape = result.isEscape;
    var score = pokeGame.score;
    var me_x = 1;
    if (isEscape) { me_x = -1; }

    pokeGame.playersResults = {};

    logger.info('CalcService.calcGameOver, pokeGame',pokeGame);
    if (player.isLord()) {
        logger.info('CalcService.calcGameOver, player is lord.');
        var real_win_total = score.raked_total;
        if (result.ddzProfiles[player.userId].coins < score.raked_total){
            real_win_total = result.ddProfiles[player.userId].coins;
        }
        pokeGame.playersResults[player.userId] = me_x * real_win_total;
        logger.info('CalcService.calcGameOver, pokeGame.playersResults=',pokeGame.playersResults);
        var plan_farmer_lose = real_win_total / 2;

        var max_farmer_userId = player1.userId;
        var min_farmer_userId = player2.userId;
        if (result.ddzProfiles[player1.userId].coins > result.ddzProfiles[player2.userId].coins){
            max_farmer_userId = player2.userId;
            min_farmer_userId = player1.userId;
        }
        if (result.ddzProfiles[min_farmer_userId].coins < plan_farmer_lose){
            logger.info('CalcService.calcGameOver, coins < plan_farmer_lose.');
            pokeGame.playersResults[min_farmer_userId] = -1 * me_x * result.ddzProfiles[min_farmer_userId].coins;
            var max_farmer_lose = (2 * plan_farmer_lose) - result.ddzProfiles[min_farmer_userId].coins;
            if (max_farmer_lose > (score.raked_total / 2)){
                max_farmer_lose = score.raked_total / 2;
            }
            if (max_farmer_lose > result.ddzProfiles[max_farmer_userId].coins){
                max_farmer_lose = result.ddzProfiles[max_farmer_userId].coins;
            }
            pokeGame.playersResults[max_farmer_userId] = -1 * me_x * max_farmer_lose;
        }
        else {
            logger.info('CalcService.calcGameOver, coins > plan_farmer_lose.');
            pokeGame.playersResults[player1.userId] = -1 * me_x * plan_farmer_lose;
            pokeGame.playersResults[player2.userId] = -1 * me_x * plan_farmer_lose;
        }
        logger.info('CalcService.calcGameOver, pokeGame.playersResults=',pokeGame.playersResults);

    } else {
        logger.info('CalcService.calcGameOver, player is not lord.');
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
        pokeGame.playersResults[lordUser.userId] = -1 * me_x * real_lord_lose;

        var max_farmer_userId = player.userId;
        var min_farmer_userId = farmerUser.userId;
        if (result.ddzProfiles[farmerUser.userId].coins > result.ddzProfiles[player.userId].coins){
            max_farmer_userId = farmerUser.userId;
            min_farmer_userId = player.userId;
        }
        var plan_farmer_win = real_lord_lose / 2;
        if (result.ddzProfiles[min_farmer_userId].coins < plan_farmer_win){
            logger.info('CalcService.calcGameOver, coins < plan_farmer_win');
            pokeGame.playersResults[min_farmer_userId] =  me_x * result.ddzProfiles[min_farmer_userId].coins;
            var max_farmer_win = 2 * plan_farmer_win - result.ddzProfiles[min_farmer_userId].coins;
            if (max_farmer_win > winScore){
                max_farmer_win = winScore;
            }
            if (max_farmer_win > result.ddzProfiles[max_farmer_userId].coins){
                max_farmer_win = result.ddzProfiles[max_farmer_userId].coins;
            }
            pokeGame.playersResults[min_farmer_userId] =  me_x * max_farmer_win;
        }
        else {
            logger.info('CalcService.calcGameOver, coins > plan_farmer_win');
            pokeGame.playersResults[player.userId] =  me_x * plan_farmer_win;
            pokeGame.playersResults[farmerUser.userId] =  me_x * plan_farmer_win;
        }
        logger.info('CalcService.calcGameOver, pokeGame.playersResults=',pokeGame.playersResults);
    }
    logger.info('CalcService.calcGameOver, end, pokeGame',pokeGame);
};
