/**
 * Created by edwardzhou on 13-12-10.
 */

var utils = require('../../util/utils');

var PlayerJoinAction = function(opts) {

};

module.exports = PlayerJoinAction;

PlayerJoinAction.doPlayerJoin = function(table, player, cb) {
  table.addPlayer(player);
  player.reset();

  utils.invokeCallback(cb, null, null);
};