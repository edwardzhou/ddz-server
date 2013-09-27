var DomainBase = require('./domainBase');
var Player = require('./player');
var util = require('util');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../util/utils');


var GameTable = function (opts) {
  DomainBase.call(this, opts);
  this.tableId = opts.tableId;
  this.players = [];
  if (!!opts.players) {
    for (var index = 0; index < opts.players.length; index++) {
      var player = opts.players[index];
      if (! (player instanceof Player) )
        player = new Player(player);
      this.players.push(player);
    }
  }
  this.state = opts.state || 0;
  //this.jsonAttrs = {tableId: "tid", players: "players"};
};

util.inherits(GameTable, DomainBase);

module.exports = GameTable;

GameTable.jsonAttrs = {tableId: "tid", players: "players"};

GameTable.prototype.addPlayer = function (player) {
  if (!(player instanceof Player) )
    player = new Player(player);
  this.players.push(player);
  player.tableId = this.tableId;

  utils.on(player, "ready", this.onPlayerReady.bind(this));
  //player.on("onReady", this.onPlayerReady.bind(this) );

  return player;
};

GameTable.prototype.removePlayer = function (playerId) {
  var index = -1;
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].userId == playerId) {
      index = i;
      break;
    }
  }

  if (index >= 0) {
    return this.players.splice(index, 1);
  }

  return null;
};

GameTable.prototype.getPlayerUidsMap = function() {
  var uids = [];
  for (var index=0; index<this.players.length; index++) {
    var player = this.players[index];
    uids.push({
      uid: player.userId,
      sid: player.serverId
    });
  }
  return uids;
};

GameTable.prototype.onPlayerReady = function (player) {
  logger.info("player[%j] is ready", player);
  this.emit("playerReady", this, player);
};

GameTable.prototype.setupEvents = function (service) {

};