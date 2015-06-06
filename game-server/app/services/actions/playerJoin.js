/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
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