var DomainBase = require('./domainBase');
var Player = require('./player');
var util = require('util');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../util/utils');
var TableState = require('../consts/consts').TableState;


var GameTable = function (opts) {
  DomainBase.call(this, opts);
  this.tableId = opts.tableId;
  this.room = opts.room;
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

  this.state = TableState.BUSY;
  this.lastAccessTime = new Date();

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

  var player = null;
  if (index >= 0) {
    player = this.players.splice(index, 1);
    this.lastAccessTime = new Date();
  }

  if (this.players.length == 0) {
    this.state = TableState.IDLE;
  }

  return player;
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

GameTable.prototype.reset = function() {
  this.nextUserId = null;
  this.lordPokeCards = [];
  this.lordValue = 0;
  for (var index=0; index<this.players.length; index++) {
    this.players[index].pokeCards = [];
  }

};

GameTable.prototype.setupEvents = function (service) {

};