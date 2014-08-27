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

var GameOverAction = function(opts) {

};

module.exports = GameOverAction;

var calcPlayerEscape = function(table, player) {
  var pokeGame = table.pokeGame;
  var player1 = pokeGame.getNextPlayer(player.userId);
  var player2 = pokeGame.getNextPlayer(player1.userId);

  if (player.role == PlayerRole.NONE) {
    player.role = PlayerRole.LORD;
  }

  if (!pokeGame.lordValue || pokeGame.lordValue < 3) {
    pokeGame.lordValue = 3;
  }

  if (player.isLord()) {
    pokeGame.score.spring = -1;
    pokeGame.lordValue *= 2;
    pokeGame.lordWon = false;
  } else {
    pokeGame.score.spring = 1;
    pokeGame.lordValue *= 2;
    pokeGame.lordWon = true;
  }

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
  if (player.isLord()) {
    score.players.push({
      userId: player.userId,
      nickName: player.nickName,
      score: -1 * score.total,
      pokeCards: CardUtil.pokeCardsToString(player.pokeCards)
    });
    score.players.push({
      userId: player1.userId,
      nickName: player1.nickName,
      score: score.raked_total / 2,
      pokeCards: CardUtil.pokeCardsToString(player1.pokeCards)

    });
    score.players.push({
      userId: player2.userId,
      nickName: player2.nickName,
      score: score.raked_total / 2,
      pokeCards: CardUtil.pokeCardsToString(player2.pokeCards)
    });
  } else {
    var lordUser, farmerUser;
    if (player1.isLord()) {
      lordUser = player1;
      farmerUser = player2;
    } else {
      lordUser = player2;
      farmerUser = player1;
    }

    score.players.push({
      userId: lordUser.userId,
      nickName: lordUser.nickName,
      score:  score.raked_total,
      pokeCards: CardUtil.pokeCardsToString(lordUser.pokeCards)

    });
    score.players.push({
      userId: player.userId,
      nickName: player.nickName,
      score: -1 * score.total,
      pokeCards: CardUtil.pokeCardsToString(player.pokeCards)

    });
    score.players.push({
      userId: farmerUser.userId,
      nickName: farmerUser.nickName,
      score: 0,
      pokeCards: CardUtil.pokeCardsToString(farmerUser.pokeCards)
    });
  }

};

var calcNormalGameOver = function(table, player) {
  var pokeGame = table.pokeGame;

  var player1 = pokeGame.getNextPlayer(player.userId);
  var player2 = pokeGame.getNextPlayer(player1.userId);

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
  if (player.isLord()) {
    player.ddzProfile.updateCoins(score.raked_total);
    player1.ddzProfile.updateCoins(score.total / -2);
    player2.ddzProfile.updateCoins(score.total / -2);
    score.players.push({
      userId: player.userId,
      nickName: player.nickName,
      score: score.raked_total,
      ddzProfile: player.ddzProfile.toParams(),
      pokeCards: CardUtil.pokeCardsToString(player.pokeCards)
    });
    score.players.push({
      userId: player1.userId,
      nickName: player1.nickName,
      score: score.total / -2,
      ddzProfile: player1.ddzProfile.toParams(),
      pokeCards: CardUtil.pokeCardsToString(player1.pokeCards)

    });
    score.players.push({
      userId: player2.userId,
      nickName: player2.nickName,
      score: score.total / -2,
      ddzProfile: player2.ddzProfile.toParams(),
      pokeCards: CardUtil.pokeCardsToString(player2.pokeCards)
    });
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

    lordUser.ddzProfile.updateCoins(-1 * score.total);
    player.ddzProfile.updateCoins(winScore);
    farmerUser.ddzProfile.updateCoins(winScore);

    score.players.push({
      userId: lordUser.userId,
      nickName: lordUser.nickName,
      score:  -1 * score.total,
      ddzProfile: lordUser.ddzProfile.toParams(),
      pokeCards: CardUtil.pokeCardsToString(lordUser.pokeCards)

    });
    score.players.push({
      userId: player.userId,
      nickName: player.nickName,
      score: winScore,
      ddzProfile: player.ddzProfile.toParams(),
      pokeCards: CardUtil.pokeCardsToString(player.pokeCards)

    });
    score.players.push({
      userId: farmerUser.userId,
      nickName: farmerUser.nickName,
      score: winScore,
      ddzProfile: farmerUser.ddzProfile.toParams(),
      pokeCards: CardUtil.pokeCardsToString(farmerUser.pokeCards)

    });
  }
};

GameOverAction.doGameOver = function(table, player, cb) {
  var pokeGame = table.pokeGame;

  var playerIds = pokeGame.players.map(function(player) { return player.userId; });
  DdzProfile.findQ({userId: {$in: playerIds }})
    .then(function(ddzProfiles) {
      for (var index=0; index<ddzProfiles.length; index++) {
        var profile = ddzProfiles[index];
        pokeGame.getPlayerByUserId(profile.userId).ddzProfile = profile;
      }
    })
    .then(function() {
      if (player.pokeCards.length == 0) {
        calcNormalGameOver(table, player);
      } else {
        calcPlayerEscape(table, player);
      }

      return Q.all( pokeGame.players.map(function(player){return player.ddzProfile.saveQ();}))
    })
    .then(function() {
      var result = pokeGame.toParams(['players', 'grabbingLord']);
      result.lordWon = pokeGame.lordWon;
      result.score = {};
      result.score.lordWon = pokeGame.lordWon? 1 : 0;
      result.score.rake = pokeGame.score.rake;
      result.score.ante = pokeGame.score.ante;
      result.score.lordValue = pokeGame.score.lordValue;
      result.score.bombs = pokeGame.score.bombs;
      result.score.spring = pokeGame.score.spring;
      result.score.total = pokeGame.score.total;
      result.score.rakedTotal = pokeGame.score.raked_total;
      result.score.rakeValue = result.score.total - result.score.rakedTotal;
      result.score.players = pokeGame.score.players.slice(0);

      utils.invokeCallback(cb, null, result.score);
    })
    .fail(function(error) {
      logger.error('[GameOverAction.doGameOver] Error: ', error);
      utils.invokeCallback(cb, null, result.score);
    });

};