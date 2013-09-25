var DomainBase = require('./domainBase');
var Player = require('./player');
var util = require('util');

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
  this.jsonAttrs = {tableId: "tid", players: "players"};
};

util.inherits(GameTable, DomainBase);

module.exports = GameTable;

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

