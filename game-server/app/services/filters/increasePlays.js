/**
 * Created by edwardzhou on 13-12-10.
 */

var utils = require('../../util/utils');

var IncreasePlaysAfterFilter = function(opts) {

};

module.exports = IncreasePlaysAfterFilter;

IncreasePlaysAfterFilter.execute = function(params, cb) {
  var table = params.table;
  var pokeGame = table.pokeGame;
  var player = params.player;
  var pokeChars = params.pokeChars;

  // 有效出牌
  if (pokeGame.lastUserId == player.userId && pokeChars.length > 0) {
    player.plays ++;
  }

  utils.invokeCallback(cb, null, params);
};