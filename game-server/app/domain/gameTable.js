var EventEmitter = require('events').EventEmitter;
var Player = require('./player');
var util = require('util');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var utils = require('../util/utils');
var TableState = require('../consts/consts').TableState;
var GameState = require('../consts/consts').GameState;
var PlayerState = require('../consts/consts').PlayerState;

/**
 * 游戏桌子
 * @param opts - 初始化参数
 * @constructor
 */
var GameTable = function (opts) {
  EventEmitter.call(this, opts);
  this.tableId = opts.tableId;
  this.room = opts.room;
  this.players = [];
  this.gameSate = GameState.PENDING_FOR_READY;

  if (!!opts.players) {
    for (var index = 0; index < opts.players.length; index++) {
      var player = opts.players[index];
      if (! (player instanceof Player) )
        player = new Player(player);
      player.tableId = this.tableId;
      this.players.push(player);
    }
  }
  this.state = opts.state || 0;
};

// GameTable继承于DomainBase
util.inherits(GameTable, EventEmitter);
// 导出GameTable
module.exports = GameTable;

var __toParams = function(model, excludeAttrs) {
  var transObj = {
    tableId: model.tableId,
    players: []
  };

  for (var index in model.players) {
    transObj.players.push( model.players[index].toParams() );
  }

  if (!!excludeAttrs) {
    for (var index in excludeAttrs) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

GameTable.toParams = __toParams;

GameTable.prototype.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};

GameTable.prototype.release = function() {
  for (var index=0; index < this.players.length; index++) {
    var player = this.players[index];
    player.reset();
  }
  this.players.splice(0, this.players.length);

  this.table.pokeGame = null;

  if(!!this.room) {
    this.room.releaseTable(this);
  }
};



GameTable.prototype.getPlayerByUserId = function(userId) {
  for (var index in this.players) {
    if (userId == this.players[index].playerId) {
      return this.players[index];
    }
  }

  return null;
};

/**
 * 添加玩家
 * @param player
 * @returns {*}
 */
GameTable.prototype.addPlayer = function (player) {

  var existPlayer = this.getPlayerByUserId(player.userId);
  if (!!existPlayer)
    return existPlayer;

  if (!(player instanceof Player) )
    player = new Player(player);
  this.players.push(player);
  player.tableId = this.tableId;

  //utils.on(player, "ready", this.onPlayerReady.bind(this));

  this.state = TableState.BUSY;
  this.lastAccessTime = new Date();

  return player;
};

/**
 * 移除玩家
 * @param playerId
 * @returns {*}
 */
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

/**
 * 提取玩家的uid map [{uid: userId, sid: serverId}, {} ...]，用于发送消息
 * @returns {Array}
 */
GameTable.prototype.getPlayerUidsMap = function() {
  var uids = [];
  for (var index=0; index<this.players.length; index++) {
    var player = this.players[index];
    if (!player.connectionLost) {
      uids.push({
        uid: player.userId,
        sid: player.serverId
      });
    }
  }
  return uids;
};

/**
 * 玩家ready事件处理
 * @param player
 */
GameTable.prototype.onPlayerReady = function (player) {
  logger.info("player[%j] is ready", player);
  this.emit("playerReady", this, player);
};

/**
 * 复位状态
 */
GameTable.prototype.reset = function() {
  this.nextUserId = null;
  this.lordPokeCards = [];
  this.lordValue = 0;
  this.pokeGame = null;
  this.gameSate = GameState.PENDING_FOR_READY;
  for (var index=0; index<this.players.length; index++) {
    var player = this.players[index];
    player.reset();
  }
};
