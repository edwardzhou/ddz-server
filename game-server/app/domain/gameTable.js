var DomainBase = require('./domainBase');
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
  DomainBase.call(this, opts);
  this.tableId = opts.tableId;
  this.room = opts.room;
  this.players = [];
  this.gameSate = GameState.PENDING_FOR_READY;

  if (!!opts.players) {
    for (var index = 0; index < opts.players.length; index++) {
      var player = opts.players[index];
      if (! (player instanceof Player) )
        player = new Player(player);
      this.players.push(player);
    }
  }
  this.state = opts.state || 0;
};

// GameTable继承于DomainBase
util.inherits(GameTable, DomainBase);
// 导出GameTable
module.exports = GameTable;
// 设置用于toParams导出的json属性映射
GameTable.jsonAttrs = {tableId: "tid", players: "players"};

/**
 * 添加玩家
 * @param player
 * @returns {*}
 */
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
    uids.push({
      uid: player.userId,
      sid: player.serverId
    });
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
