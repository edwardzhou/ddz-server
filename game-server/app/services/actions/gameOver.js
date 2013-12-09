/**
 * Created by edward on 13-12-9.
 */

var GameOverAction = function(opts) {

};

module.exports = GameOverAction;

GameOverAction.doGameOver = function(table, player, cb) {
  var pokeGame = table.pokeGame;

  var player1 = pokeGame.getNextPlayer(player.userId);
  var player2 = pokeGame.getNextPlayer(player1.userId);

  if (player.isLord()) {
    // 两家农民都没有出过牌,春天
    if (player1.plays == 0 && player2.plays ==0) {
      pokeGame.score.spring = 1;
    }
  } else {
    var lord = player1.isLord()? player1 : player2;
    // 如果地主只出过一手牌,反春天
    if (lord.plays == 1) {
      pokeGame.score.spring = -1;
    }
  }

};