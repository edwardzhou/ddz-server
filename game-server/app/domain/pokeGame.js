var GameState = require('../consts/consts').GameState;
var PokeCard = require('pokeCard');

var PokeGame = function(opts) {
  opts = opts || {};

  this.roomId = opts.roomId;
  this.tableId = opts.tableId;
  this.players = (!!opts.players)? opts.players.slice(0, opts.players.length) : [];
  this.state = opts.state || GameState.PENDING_FOR_READY;
  this.actions = options.actions || [];
  this.lastAccessTime = new Date();

  return this;
};

module.exports = PokeGame;

PokeGame.newGame = function(roomId, tableId, players) {
  var opts = {roomId: roomId, tableId: tableId, players: players, state: GameState.PENDING_FOR_READY};
  var game = new PokeGame(opts);

  return game;
};

