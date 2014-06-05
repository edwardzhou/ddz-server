/**
 * Created by edwardzhou on 13-12-2.
 */

var utils = require('../../util/utils');

var IncreateSeqNoFilter = function(opts) {

};

module.exports = IncreateSeqNoFilter;

IncreateSeqNoFilter.execute = function(params, cb) {
  var table = params.table;
  var pokeGame = table.pokeGame;
  var player = params.player;

  if (!!pokeGame) {
    if (!params.keepNextUserId) {
      var nextPlayer = pokeGame.getNextPlayer(player.userId);
      pokeGame.token.nextUserId = nextPlayer.userId;
    }

    if (!params.keepSeqNo) {
      pokeGame.token.currentSeqNo ++;
    }
  }

  utils.invokeCallback(cb, null, params);
};