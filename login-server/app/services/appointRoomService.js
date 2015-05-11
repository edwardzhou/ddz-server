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
var User = require('../domain/user');
var AppointPlay = require('../domain/appointPlay');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var messageService = require('./messageService');


var AppointRoomService = function(theApp) {
  BaseRoomService.call(this, theApp);
  this.clazzName = 'AppointRoomService';
};

util.inherits(AppointRoomService, BaseRoomService);

module.exports = AppointRoomService;


BaseRoomService.prototype.tryEnterRoom = function(userId, roomId, tableId, cb) {
  var self = this;
  var appointId = tableId;
  //var response = {};
  User.findOne({userId: userId})
    .populate('ddzProfile')
    .execQ()
    .then(function(user) {
      var room = self.getRoom(roomId);
      var errorCode = ErrorCode.SUCCESS;
      var errorMsg = "";
      if (room.minCoinsQty > 0) {
        if (room.minCoinsQty > user.ddzProfile.coins) {
          errorCode = ErrorCode.CANNOT_ENTER_ROOM;
          errorMsg = '您的金币不足, 无法进入房间!';
        }
      }
      if (errorCode == ErrorCode.SUCCESS && room.maxCoinsQty > 0) {
        if (room.maxCoinsQty < user.ddzProfile.coins) {
          errorCode = ErrorCode.CANNOT_ENTER_ROOM;
          errorMsg = '您的金币超过房间的准入上限, 请移步到更高级的房间!';
        }
      }

      if (errorCode != ErrorCode.SUCCESS) {
        throw Result.genErrorResult(errorCode, 0 , errorMsg);
      }

      return AppointPlay.getByAppointIdQ(appointId);
    })
    .then(function(appointPlay) {
      if (appointPlay == null) {
        throw Result.genErrorResult(ErrorCode.APPOINT_PLAY_NOT_EXISTS, 0, '该场约战已过期, 请发起新约战!');
      }

      if (!!appointPlay) {
        if (!appointPlay.hasPlayer(userId)) {
          throw Result.genErrorResult(ErrorCode.APPOINT_HAS_NO_SUCH_PLAYER, 0, '您不属于该场约战!');
        }
      }

      //results.appointPlay = appointPlay;
      utils.invokeCallback(cb, null, new Result(ErrorCode.SUCCESS, 0, ''));
    })
    .fail(function(err) {
      logger.error('[AppointRoomService.tryEnterRoom] ERROR: ', err);
      var resp = err.result || new Result(ErrorCode.SYSTEM_ERROR, 0, err);
      utils.invokeCallback(cb, null, resp);
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
  var self = this;
  var room = this.roomsMap[roomId];
  var results = {};

  AppointPlay.getByAppointIdQ(appointId)
    .then(function(appointPlay) {
      if (appointPlay == null) {
        throw Result.genErrorResult(ErrorCode.APPOINT_PLAY_NOT_EXISTS, 0, '该场约战已过期, 请发起新约战!');
      }

      if (!!appointPlay) {
        if (!appointPlay.hasPlayer(player.userId)) {
          throw Result.genErrorResult(ErrorCode.APPOINT_HAS_NO_SUCH_PLAYER, 0, '您不属于该场约战!');
        }
      }

      results.appointPlay = appointPlay;

      if (!!appointPlay) {
        var table = room.tablesMap[appointId];
        if (!table) {
          table = room.newTable(appointId);
        }

        player = room.enter(player);
        player = table.addPlayer(player);

        self.playerReady(room, player, function(table) {
          //utils.invokeCallback(cb, table);
        });

        utils.invokeCallback(cb, null, room);
      }
    })
    .fail(function(err) {
      logger.error('[AppointRoomService.prototype.enterRoom] Error: ', err);
      utils.invokeCallback(cb, err, null);
    });

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
    self.clearTableReadyTimeout(room, table);
    var result = new Result(ErrorCode.SUCCESS);
    result.startNewGame = true;
    //utils.invokeCallback(callback, null, result);
    this.updateTablePlayerUserSession(table);
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

AppointRoomService.prototype.clearTableReadyTimeout = function(room, table) {
  logger.debug("[AppointRoomService.clearTableReadyTimeout] table timeout, remove it: ", room, table);
  if (!!table.readyTimeoutId) {
    clearTimeout(table.readyTimeoutId);
    table.readyTimeoutId = null;
  }
};


AppointRoomService.prototype.onTableReadyTimeout = function(room, table) {
  if (!!table.readyTimeoutId) {
    clearTimeout(table.readyTimeoutId);
    table.readyTimeoutId = null;
  }
  logger.info("[AppointRoomService.onTableReadyTimeout] table timeout, remove it: ", room, table);
  room.removeTable(table);
};

AppointRoomService.prototype.setupTableReadyTimeout = function(room, table, seconds) {
  var self = this;
  this.clearTableReadyTimeout(room, table);
  table.readyTimeoutId = setTimeout(function(){
    self.onTableReadyTimeout(room, table);
  }, seconds * 1000);
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
  var self = this;
  table.reset();
  this.setupTableReadyTimeout(room, table, 5 * 60);
};

