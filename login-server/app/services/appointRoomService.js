/**
 * Created by edwardzhou on 15/4/27.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var BaseRoomService = require('./baseRoomService');
var GameTable = require('../domain/gameTable');
var PlayerState = require('../consts/consts').PlayerState;
var Player = require('../domain/player');
var Result = require('../domain/result');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var messageService = require('./messageService');


var AppointRoomService = function(theApp) {
  BaseRoomService.call(this, theApp);
  this.clazzName = 'AppointRoomService';
};

util.inherits(AppointRoomService, BaseRoomService);

module.exports = AppointRoomService;


AppointRoomService.prototype.pushPlayerJoinEvents = function(theTable) {
  process.nextTick(function () {
    messageService.pushTableMessage(theTable, "onPlayerJoin", theTable.toParams(), null);
  });
};

/**
 * 玩家进入房间
 * @param player - 玩家
 * @param roomId - 房间id
 * @param appointId - 玩家上次进入时的table id
 * @param cb
 */
AppointRoomService.prototype.enterRoom = function(player, roomId, autoReady, appointId, cb) {
  var room = this.roomsMap[roomId];

  var table = room.tablesMap[appointId];
  if (!table) {
    table = room.newTable(appointId);
  }

  player = room.enter(player);
  player = table.addPlayer(player);

  this.playerReady(room, player, function(table) {
    //utils.invokeCallback(cb, table);
  });

  return room;
};

AppointRoomService.prototype.playerReady = function(room, player, callback) {
  // this.clearPlayerReadyTimeout();
  var self = this;

  var player = room.playersMap[player.userId];
  player.state = PlayerState.READY;

  logger.info('[AppointRoomService.prototype.playerReady] player ready: ', player);

  var result;

  var table = room.getGameTable(player.tableId);
  if (table == null) {
    utils.invokeCallback(callback, null, Result.genErrorResult(ErrorCode.TABLE_RELEASED, 0, '牌桌已经不存在'));
    return false;
  }

  result = new Result(ErrorCode.SUCCESS);
  result.table = table;
  utils.invokeCallback(callback, null, table, false);

  this.pushPlayerJoinEvents(table);


  // utils.invokeCallback(this.onPlayerJoinCallback, table);

  if (table.players.length == 3 &&
      table.players[0].state == PlayerState.READY &&
      table.players[1].state == PlayerState.READY &&
      table.players[2].state == PlayerState.READY) {
    var result = new Result(ErrorCode.SUCCESS);
    result.startNewGame = true;
    //utils.invokeCallback(callback, null, result);
    process.nextTick(function(){
      utils.invokeCallback(self.onStartNewGameCallback, table);
    });
    return true;
  }

};



AppointRoomService.prototype.onPlayerReadyTimeout = function(room) {
  if (!!room.playerReadyTimeout) {
    clearTimeout(room.playerReadyTimeout);
    room.playerReadyTimeout = null;
  }

};

/**
 * 玩家离开房间
 * @param roomId
 * @param playerId
 * @param cb
 */
AppointRoomService.prototype.leave = function(roomId, playerId, cb) {
  var room = this.roomsMap[roomId];
  var player = room.getPlayer(playerId);
  var table = room.getGameTable(player.tableId);

  if (!!table && !!table.pokeGame) {
    this.theApp.get('cardService').gameOver(table, player, function() {
      utils.invokeCallback(cb, room.leave(playerId));
      table.removePlayer(playerId);
      this.pushPlayerJoinEvents(table);
    });
  } else {
    utils.invokeCallback(cb, room.leave(playerId));
    table.removePlayer(playerId);
    this.pushPlayerJoinEvents(table);
  }

};


AppointRoomService.prototype.releaseTable = function(room, table) {
  table.reset();
};

