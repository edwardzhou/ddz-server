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
                    pokeGame.lordValue = pokeGame.startLordValue;
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
            score.total = score.ante * score.lordValue * Math.pow(2, Math.abs(score.spring)) * 2;
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
            CalcService.calcGameOverEscapeFix(result);
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
            score.total = score.ante * score.lordValue * Math.pow(2, Math.abs(score.spring)) * 2;
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

            CalcService.calcGameOverFix(result);
            utils.invokeCallback(cb, null, result);
        })
        .fail(function(error) {
            logger.error('[CalcService.calcNormalGameOver] Error: ', error);
            utils.invokeCallback(cb, null, error);
        });

};

CalcService.calcGameOverFix = function(calcResult){
  //logger.info('CalcService.calcGameOverFix');
  var result = calcResult;
  var player = result.player;
  var player1 = result.player1;
  var player2 = result.player2;
  var pokeGame = result.pokeGame;
  var isEscape = result.isEscape;
  var score = pokeGame.score;
  var raked_total = 0;
  var me_x = 1;
  if (isEscape) { me_x = -1; }

  pokeGame.playersResults = {};

  //logger.info('CalcService.calcGameOverFix, calcResult',calcResult);
  //logger.info('CalcService.calcGameOverFix, pokeGame',pokeGame);
  if (player.isLord()) {
    //logger.info('CalcService.calcGameOverFix, player is lord.');
    // 地主胜利

    // 玩家实际能赢的金币
    var real_win_total = score.total;
    if (result.ddzProfiles[player.userId].coins < score.raked_total){
      real_win_total = result.ddzProfiles[player.userId].coins;
    }

    // 另外两家正常应输的金币
    var player_should_lose = score.total / 2;

    // 另外两家实际输的金币
    var player1_lose = real_win_total / 2;
    var player2_lose = real_win_total / 2;

    // 如果 player1 的金币不够支付?
    if (player1_lose > result.ddzProfiles[player1.userId].coins) {
      // 则 player1 则支付他现有的金币
      // 如果 player2 的金币也不够支付
      if (player2_lose > result.ddzProfiles[player2.userId].coins) {
        // 则 player2 支付他现有的金币
        player2_lose = result.ddzProfiles[player2.userId].coins;
      } else {
        // 当 player2 金币足够的, 情况下, 支付 player1 应支付的差额
        player2_lose = player2_lose + (player1_lose - result.ddzProfiles[player1.userId].coins);
        // 但是,  player2 支付的上限, 是他正常应输的金币
        if (player2_lose > player_should_lose) {
          player2_lose = player_should_lose;
        }
        // 而且, 不能超过他现有的金币
        if (player2_lose > result.ddzProfiles[player2.userId].coins){
          player2_lose = result.ddzProfiles[player2.userId].coins;
        }
      }
      player1_lose = result.ddzProfiles[player1.userId].coins;
    } else {
      // player1 的金币足够支付, 查看 player2 的是否足够
      if (player2_lose > result.ddzProfiles[player2.userId].coins) {
        // 不够, 则支付player2现有的金币, 差额有 player1 补上
        player1_lose = player1_lose + (player2_lose - result.ddzProfiles[player2.userId].coins);
        if (player1_lose > player_should_lose) {
          player1_lose = player_should_lose;
        }
        if (player1_lose > result.ddzProfiles[player1.userId].coins) {
          player1_lose = result.ddzProfiles[player1.userId].coins
        }
        player2_lose = result.ddzProfiles[player2.userId].coins;
      }
    }

    // 如果两个农民的钱不够, 则实际能赢的也就是他们的总和
    if (real_win_total > (player1_lose + player2_lose)) {
      real_win_total = player1_lose + player2_lose;
    }

    if (score.rake >= 1) {
      raked_total = real_win_total - score.rake;
    } else if (score.rake > 0) {
      raked_total = real_win_total - real_win_total * score.rake;
    }

    pokeGame.playersResults[player.userId] = raked_total;
    pokeGame.playersResults[player1.userId] = -1 * player1_lose;
    pokeGame.playersResults[player2.userId] = -1 * player2_lose;

    //logger.info('CalcService.calcGameOverFix, pokeGame.playersResults=', pokeGame.playersResults);

  } else {
    //logger.info('CalcService.calcGameOverFix, player is not lord.');
    // 农民胜利
    var lordUser, farmerUser;
    if (player1.isLord()) {
      lordUser = player1;
      farmerUser = player2;
    } else {
      lordUser = player2;
      farmerUser = player1;
    }

    var real_win_total = score.total;
    if (real_win_total > result.ddzProfiles[lordUser.userId].coins) {
      real_win_total = result.ddzProfiles[lordUser.userId].coins;
    }

    var player_should_win = score.total / 2;
    var farmer1_win = real_win_total / 2;
    var farmer2_win = real_win_total / 2;

    // 如果 农民1的金币,小于能赢的金币, 则他只能赢取他现有的金币数, 多余部分, 根据情况给 农民2
    if (farmer1_win > result.ddzProfiles[player.userId].coins) {
      // 如果农民2的金币数, 也小于能赢的金币数, 则他也只能赢取他现有的金币数
      if (farmer2_win > result.ddzProfiles[farmerUser.userId].coins) {
        farmer2_win = result.ddzProfiles[farmerUser.userId].coins;
      } else {
        // 农民2的金币数, 多于能赢的金币数, 则尝试把农民1少赢的金币数给农民2
        farmer2_win = farmer2_win + farmer1_win - result.ddzProfiles[player.userId].coins;
        // 农民2赢的金币数, 必须不超过他正常最大能赢的.
        if (farmer2_win > player_should_win) {
          farmer2_win = player_should_win;
        }
        // 而且, 不能超过他的现有金币数
        if (farmer2_win > result.ddzProfiles[farmerUser.userId].coins) {
          farmer2_win = result.ddzProfiles[farmerUser.userId].coins;
        }
      }

      farmer1_win = result.ddzProfiles[player.userId].coins;
    } else {
      // 农民1的金币数 大于 能赢的金币数, 根据情况, 把如果农民2少赢的金币给农民1
      if (farmer2_win > result.ddzProfiles[farmerUser.userId].coins) {
        // 把农民2少赢的金币数, 尝试给农民1
        farmer1_win = farmer1_win + farmer2_win - result.ddzProfiles[farmerUser.userId].coins;
        if (farmer1_win > player_should_win) {
          farmer1_win = player_should_win;
        }
        if (farmer1_win > result.ddzProfiles[player.userId].coins) {
          farmer1_win = result.ddzProfiles[player.userId].coins;
        }
        farmer2_win = result.ddzProfiles[farmerUser.userId].coins;
      }
    }

    if (real_win_total > farmer1_win + farmer2_win) {
      real_win_total = farmer1_win + farmer2_win;
    }

    // 计算佣金, 由农民1 农民2分摊
    var rake = 0;
    if (score.rake > 1) {
      rake = score.rake / 2;
    } else if (score.rake > 0) {
      rake = Math.floor( real_win_total * score.rake / 2 );
    }

    // 扣除农民1的佣金
    farmer1_win = farmer1_win - rake;
    if (farmer1_win < 0) {
      farmer1_win = 0;
    }
    // 扣除农民2的佣金
    farmer2_win = farmer2_win - rake;
    if (farmer2_win < 0) {
      farmer2_win = 0;
    }

    pokeGame.playersResults[lordUser.userId] = -1 * real_win_total;
    pokeGame.playersResults[player.userId] = farmer1_win;
    pokeGame.playersResults[farmerUser.userId] = farmer2_win;

    //logger.info('CalcService.calcGameOverFix, pokeGame.playersResults=', pokeGame.playersResults);
  }
 // logger.info('CalcService.calcGameOverFix, end, pokeGame',pokeGame);
};


CalcService.calcGameOverEscapeFix = function(calcResult){
  //logger.info('CalcService.calcGameOver');
  var result = calcResult;
  var player = result.player;
  var player1 = result.player1;
  var player2 = result.player2;
  var pokeGame = result.pokeGame;
  var isEscape = result.isEscape;
  var score = pokeGame.score;
  var raked_total = 0;
  var me_x = 1;
  if (isEscape) { me_x = -1; }

  pokeGame.playersResults = {};

  //logger.info('CalcService.calcGameOverEscapeFix, pokeGame',calcResult);
  //logger.info('CalcService.calcGameOverEscapeFix, pokeGame',pokeGame);
  if (player.isLord()) {
    //logger.info('CalcService.calcGameOverEscapeFix, player is lord.');

    // 玩家实际能输的金币
    var real_lose_total = score.total;
    if (result.ddzProfiles[player.userId].coins < real_lose_total){
      real_lose_total = result.ddzProfiles[player.userId].coins;
    }

    // 另外两家正常赢的金币
    var player_should_win = score.total / 2;

    // 另外两家实际赢的金币
    var player1_win = real_lose_total / 2;
    var player2_win = real_lose_total / 2;

    // 如果 player1 的金币少于赢的金币?
    if (player1_win > result.ddzProfiles[player1.userId].coins) {
      // 则 player1 赢的金币最多为他现有的金币
      // 如果 player2 的金币少于赢的金币
      if (player2_win > result.ddzProfiles[player2.userId].coins) {
        // 则 player2 赢的金币最多为他现有的金币
        player2_win = result.ddzProfiles[player2.userId].coins;
      } else {
        // 当 player2 金币足够的, 情况下, 加上 player1 少赢的差额
        player2_win = player2_win + (player1_win - result.ddzProfiles[player1.userId].coins);
        // 但是,  player2 赢的上限, 是他正常应赢的金币
        if (player2_win > player_should_win) {
          player2_win = player_should_win;
        }
        // 而且, 不能超过他现有的金币
        if (player2_win > result.ddzProfiles[player2.userId].coins){
          player2_win = result.ddzProfiles[player2.userId].coins;
        }
      }
      player1_win = result.ddzProfiles[player1.userId].coins;
    } else {
      // player1 的金币足够, 查看 player2 的
      if (player2_win > result.ddzProfiles[player2.userId].coins) {
        // player2 的金币少于能赢的, 则实际赢的player2现有的金币相同数量, 差额给 player1
        player1_win = player1_win + (player2_win - result.ddzProfiles[player2.userId].coins);
        // player1 赢的最多也就是正常能赢的数量
        if (player1_win > player_should_win) {
          player1_win = player_should_win;
        }
        // 而且, 不能超过他现有的数量
        if (player1_win > result.ddzProfiles[player1.userId].coins) {
          player1_win = result.ddzProfiles[player1.userId].coins
        }
        player2_win = result.ddzProfiles[player2.userId].coins;
      }
    }

    // 如果两个农民的钱不够, 则实际能赢的也就是他们的总和
    if (real_lose_total > (player1_win + player2_win)) {
      real_lose_total = player1_win + player2_win;
    }

    var rake = 0;

    if (score.rake >= 1) {
      rake = score.rake / 2;
    } else if (score.rake > 0) {
      rake = real_lose_total * score.rake / 2;
    }

    player1_win = player1_win - rake;
    if (player1_win < 0) {
      player1_win = 0;
    }
    player2_win = player2_win - rake;
    if (player2_win < 0) {
      player2_win = 0;
    }

    pokeGame.playersResults[player.userId] = -1 * real_lose_total;
    pokeGame.playersResults[player1.userId] = player1_win;
    pokeGame.playersResults[player2.userId] = player2_win;

    //logger.info('CalcService.calcGameOverEscapeFix, pokeGame.playersResults=',pokeGame.playersResults);

  } else {
    //logger.info('CalcService.calcGameOverEscapeFix, player is not lord.');
    // 农民逃跑
    var lordUser, farmerUser;
    if (player1.isLord()) {
      lordUser = player1;
      farmerUser = player2;
    } else {
      lordUser = player2;
      farmerUser = player1;
    }

    var real_lose_total = score.total;
    // 逃跑农民最多能输的,就是他现有金币
    if (real_lose_total > result.ddzProfiles[player.userId].coins) {
      real_lose_total = result.ddzProfiles[player.userId].coins;
    }
    // 而且, 不超过地主的现有金币
    if (real_lose_total > result.ddzProfiles[lordUser.userId].coins) {
      real_lose_total = result.ddzProfiles[lordUser.userId].coins;
    }

    var raked_lose_total = real_lose_total;
    if (score.rake > 1) {
      raked_lose_total = real_lose_total - score.rake;
    } else if (score.rake > 0) {
      raked_lose_total = real_lose_total - (real_lose_total * score.rake);
    }
    if (raked_lose_total < 0) {
      raked_lose_total = 0;
    }

    pokeGame.playersResults[lordUser.userId] = raked_lose_total;
    pokeGame.playersResults[player.userId] = -1 * real_lose_total;
    pokeGame.playersResults[farmerUser.userId] = 0;

    //logger.info('CalcService.calcGameOverEscapeFix, pokeGame.playersResults=',pokeGame.playersResults);
  }
  //logger.info('CalcService.calcGameOverEscapeFix, pokeGame.playersResults=', pokeGame.playersResults);
  //logger.info('CalcService.calcGameOverEscapeFix, end, pokeGame',pokeGame);
};
