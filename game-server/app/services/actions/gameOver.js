/**
 * Created by edward on 13-12-9.
 */

var utils = require('../../util/utils');
var PokeCard = require('../../domain/pokeCard');
var CardUtil = require('../../util/cardUtil');

var GameOverAction = function(opts) {

};

module.exports = GameOverAction;

GameOverAction.doGameOver = function(table, player, cb) {
  var pokeGame = table.pokeGame;

  var player1 = pokeGame.getNextPlayer(player.userId);
  var player2 = pokeGame.getNextPlayer(player1.userId);
  var lordWon = false;

  if (player.isLord()) {
    // 两家农民都没有出过牌,春天
    if (player1.plays == 0 && player2.plays ==0) {
      pokeGame.score.spring = 1;
    }
    lordWon = true;
  } else {
    var lord = player1.isLord()? player1 : player2;
    // 如果地主只出过一手牌,反春天
    if (lord.plays == 1) {
      pokeGame.score.spring = -1;
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
    score.players.push({
      userId: player.userId,
      score: score.raked_total,
      pokeCards: CardUtil.pokeCardsToIdChars(player.pokeCards)
    });
    score.players.push({
      userId: player1.userId,
      score: score.total / -2,
      pokeCards: CardUtil.pokeCardsToIdChars(player1.pokeCards)

    });
    score.players.push({
      userId: player2.userId,
      score: score.total / -2,
      pokeCards: CardUtil.pokeCardsToIdChars(player2.pokeCards)
    });
  } else {
    var lordUser, farmerUser;
    if (player1.isLord) {
      lordUser = player1;
      farmerUser = player2;
    } else {
      lordUser = player2;
      farmerUser = player1;
    }
    var winScore = Math.round(score.raked_total / 2)

    score.players.push({
      userId: lordUser.userId,
      score:  -1 * score.total,
      pokeCards: CardUtil.pokeCardsToIdChars(lordUser.pokeCards)

    });
    score.players.push({
      userId: player.userId,
      score: winScore,
      pokeCards: CardUtil.pokeCardsToIdChars(player.pokeCards)

    });
    score.players.push({
      userId: farmerUser.userId,
      score: winScore,
      pokeCards: CardUtil.pokeCardsToIdChars(farmerUser.pokeCards)

    });
  }

  var result = pokeGame.toParams(['players', 'grabbingLord']);
  result.lordWon = lordWon;
  result.score = {};
  result.score.lordWon = lordWon? 1 : 0;
  result.score.rake = pokeGame.score.rake;
  result.score.ante = pokeGame.score.ante;
  result.score.lordValue = pokeGame.score.lordValue;
  result.score.bombs = pokeGame.score.bombs;
  result.score.spring = pokeGame.score.spring;
  result.score.total = pokeGame.score.total;
  result.score.raked_total = pokeGame.score.raked_total;
  result.score.rake_value = result.score.total - result.score.raked_total;
  result.score.players = pokeGame.score.players.slice(0);

  utils.invokeCallback(cb, null, result.score);
};