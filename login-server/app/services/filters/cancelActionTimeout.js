/**
 * Created by edwardzhou on 13-12-9.
 */

var utils = require('../../util/utils');

var CancelActionTimeoutFilter = function(opt) {

};

module.exports = CancelActionTimeoutFilter;

CancelActionTimeoutFilter.execute = function(params, cb) {
  var table = params.table;
  var pokeGame = table.pokeGame;

  if (!!pokeGame.actionTimeout) {
    clearTimeout(pokeGame.actionTimeout);
    pokeGame.actionTimeout = null;
  }

  utils.invokeCallback(cb, null, params);
};