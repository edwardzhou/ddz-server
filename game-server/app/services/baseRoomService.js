/**
 * Created by edwardzhou on 15/5/2.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var GameRoom = require('../domain/gameRoom');
var utils = require('../util/utils');
var GameTable = require('../domain/gameTable');
var PlayerState = require('../consts/consts').PlayerState;
var Player = require('../domain/player');
var User = require('../domain/user');
//var BaseRoomService = require('./baseRoomService');
var ErrorCode = require('../consts/errorCode');
var Result = require('../domain/result');
var messageService = require('./messageService');


var robotService = require('./robotService');

var BaseRoomService = function(pomeloApp) {
  this.theApp = pomeloApp;
  this.roomsMap = {};
  this.onStartNewGameCallback = null;
  this.clazzName = 'BaseRoomService';
};

BaseRoomService.prototype.init = function(roomIds) {
  var self = this;
  logger.info("[%s][%s] roomIds: ",
    self.theApp.getServerId(),
    self.clazzName,
    roomIds);

  for (var index=0; index<roomIds.length; index++) {
    var roomId = roomIds[index];
    this.loadRoom(roomId, function(err, theRoomId, theRoom) {
      logger.info('[%s] [%s] BaseRoomService.init, room:',
        self.theApp.getServerId(),
        self.clazzName,
        theRoom);
      if (!!theRoom) {
        self.roomsMap[theRoom.roomId] = theRoom;
        theRoom.roomService = self;
      } else {
        logger.error('[%s] [BaseRoomService.init] failed to load room[id = %d] error:',
          self.theApp.getServerId(),
          theRoomId,
          err );
      }
    });
  }

  return this;
};

/**
 * 根据房间id获取房间实例。
 * @param roomId
 * @returns {*}
 */
BaseRoomService.prototype.getRoom = function(roomId) {
  //logger.info("roomsMap: %j", roomsMap);
  return this.roomsMap[roomId];
};

/**
 * 重新加载房间信息
 * @param cb
 */
BaseRoomService.prototype.reloadRooms = function(cb) {
  logger.info("[BaseRoomService.reloadRooms] reload rooms...");
  for (var roomId in roomsMap) {
    var room = this.roomsMap[roomId];
    room.reloadFromDb();
  }

  utils.invokeCallback(cb);
};

/**
 * 加载房间信息
 * @param roomId
 * @param callback
 */
BaseRoomService.prototype.loadRoom = function(roomId, callback) {
  GameRoom.findOne({roomId:roomId}, function(err, room) {
    if (!!room) {
      room.initRoom();
    } else {
      logger.error('[BaseRoomService.init] failed to load room[id = %d] error:', roomId, err );
    }
    utils.invokeCallback(callback, err, roomId, room);
  });
};

BaseRoomService.prototype.tryEnterRoom = function(userId, roomId, tableId, cb) {
  var self = this;
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

      utils.invokeCallback(cb, null, new Result(errorCode, 0, errorMsg));

    })
    .fail(function(err) {
      logger.error('[BaseRoomService.tryEnterRoom] ERROR: ', err);
      utils.invokeCallback(cb, null, new Result(ErrorCode.SYSTEM_ERROR, 0, err));
    });
};


/**
 * 玩家进入房间
 * @param player - 玩家
 * @param roomId - 房间id
 * @param lastTableId - 玩家上次进入时的table id
 * @param cb
 */
BaseRoomService.prototype.enterRoom = function(player, roomId, autoReady, lastTableId, cb) {
  var room = this.roomsMap[roomId];

  if (lastTableId == null && cb == null) {
    cb = autoReady;
    autoReady = true;
  } else if (cb == null) {
    cb = lastTableId;
  }

  var thePlayer = room.enter(player, lastTableId);
  if (!!autoReady) {
    this.playerReady(room, thePlayer, function(err, table, startNewGame) {
      //utils.invokeCallback(cb, table);
    });
  }

  utils.invokeCallback(cb, room);
  //return room;
};


/**
 * 获取房间指定的table
 * @param roomId
 * @param tableId
 * @returns {*}
 */
BaseRoomService.prototype.getTable = function(roomId, tableId) {
  var room = this.roomsMap[roomId];
  if (!room)
    return null;
  return room.tablesMap[tableId];
};

BaseRoomService.prototype.pushPlayerJoinEvents = function(theTable) {
  process.nextTick(function () {
    messageService.pushTableMessage(theTable, "onPlayerJoin", theTable.toParams(), null);
  });
};


/**
 * 玩家离开房间
 * @param roomId
 * @param playerId
 * @param cb
 */
BaseRoomService.prototype.leave = function(roomId, playerId, cb) {
  var room = this.roomsMap[roomId];
  var player = room.getPlayer(playerId);
  var table = room.getGameTable(player.tableId);
  if (!!table && !!table.pokeGame) {
    this.theApp.get('cardService').gameOver(table, player, function() {
      utils.invokeCallback(cb, room.leave(playerId));
    });
  } else {
    utils.invokeCallback(cb, room.leave(playerId));
  }

};


BaseRoomService.prototype.cancelTable = function(table, room) {
  var self = this;
  var index = room.tables.indexOf(table);
  room.tables.splice(index, 1);
  delete room.tablesMap[table.tableId];
  table.room = null;

  for (var playerIndex=0; playerIndex<table.players.length; playerIndex++) {
    var player = table.players[playerIndex];
    player.reset();
    var pIndex = room.readyPlayers.indexOf(player);
    if (pIndex >=0 ) {
      room.readyPlayers.splice(pIndex, 1);
    }

    if (!!player.robot) {
      //this.robotService.releaseRobotPlayers([player]);
      //room.idle_robots.push(player);
      this.theApp.rpc.robotServer.robotRemote.releaseRobotPlayers.toServer('*',[player], null);
    } else if (!!room.playersMap[player.userId] && !player.connectionLost) {
      room.readyPlayers.unshift(player);
    }
  }

  process.nextTick(function(){
    exp.onPlayerReadyTimeout(room);
  });
};

BaseRoomService.prototype.updateTablePlayerUserSession = function(table) {
  for (var index=0; index<table.players.length; index++) {
    var p = table.players[index];
    var data = {
      roomId: table.room.roomId,
      tableId: table.tableId,
      gameId: null};
    if (!!table.pokeGame) {
      data.gameId = table.pokeGame.gameId;
    }
    p.userSession.sset(data);
  }
};

BaseRoomService.prototype.playerReady = function(room, player, callback) {
  var self = this;
  // this.clearPlayerReadyTimeout();
  var player = room.playersMap[player.userId];
  player.state = PlayerState.READY;
  if (room.readyPlayers.indexOf(player) < 0)
    room.readyPlayers.push(player);

  while (room.readyPlayers.length > 2) {
    var players = room.readyPlayers.splice(0, 3);
    var table = room.arrangeTable(players);
    room.tables.push(table);
    room.tablesMap[table.tableId] = table;

    //utils.invokeCallback(callback, table);
    //utils.invokeCallback(self.onStartNewGameCallback, table);
    this.updateTablePlayerUserSession(table);
    //utils.invokeCallback(callback, null, table, true);
    self.pushPlayerJoinEvents(table);
    utils.invokeCallback(self.onStartNewGameCallback, table);
  }

  if (room.readyPlayers.length >0) {
    if (!room.playerReadyTimeout) {
      room.playerReadyTimeout = setTimeout(self.onPlayerReadyTimeout.bind(self, room), 10 * 1000);
    }
  }
};

BaseRoomService.prototype.onPlayerReadyTimeout = function(room) {
  var self = this;

  if (!!room.playerReadyTimeout) {
    clearTimeout(room.playerReadyTimeout);
    room.playerReadyTimeout = null;
  }

  var readyPlayers = room.readyPlayers.filter(function(p) {return !p.left;});
  if (readyPlayers.length > 0) {
    self.theApp.rpc.robotServer.robotRemote.idelRobotsCount.toServer('*',{}, function(err, robots_count){
      console.log('[roomService.onPlayerReadyTimeout] robots_count=', robots_count);
      if (robots_count >= readyPlayers.length){
        var players = readyPlayers.splice(0, 3);
        utils.arrayRemove(room.readyPlayers, players);
        self.theApp.rpc.robotServer.robotRemote.getRobotPlayers.toServer('*',3-players.length, function(err, robotPlayers){
          players = players.concat(robotPlayers);
          for (var robotIndex=0; robotIndex<robotPlayers.length; robotIndex++) {
            robotPlayers[robotIndex].readyForStartGame = true;
          }

          console.log('[roomService.onPlayerReadyTimeout] arrange robots:', players);
          var table = room.arrangeTable(players);
          room.tables.push(table);
          room.tablesMap[table.tableId] = table;

          //console.log('this.startNewGameCallback ', room.startNewGameCallback);
          //utils.invokeCallback(room.startNewGameCallback, table);
          utils.invokeCallback(self.onStartNewGameCallback, table);
        });
      }
      else {
        room.playerReadyTimeout = setTimeout(self.onPlayerReadyTimeout.bind(self, room), 10 * 1000);
      }
    });
  }


  //
  //if (readyPlayers.length < 3 && readyPlayers.length>0) {
  //  if (this.robotService.idelRobotsCount() >= 3 - readyPlayers.length) {
  //    var players = readyPlayers.splice(0, 3);
  //    utils.arrayRemove(room.readyPlayers, players);
  //    //var robotPlayers = room.idle_robots.splice(0, 3-players.length);
  //    var robotPlayers = this.robotService.getRobotPlayers(3-players.length);
  //    players = players.concat(robotPlayers);
  //    for (var robotIndex=0; robotIndex<robotPlayers.length; robotIndex++) {
  //      robotPlayers[robotIndex].readyForStartGame = true;
  //    }
  //
  //    console.log('[roomSchema.methods.onPlayerReadyTimeout] arrange robots:', players);
  //    var table = room.arrangeTable(players);
  //    room.tables.push(table);
  //    room.tablesMap[table.tableId] = table;
  //
  //    console.log('this.startNewGameCallback ', room.startNewGameCallback);
  //    utils.invokeCallback(room.startNewGameCallback, table);
  //  } else {
  //    room.playerReadyTimeout = setTimeout(exp.onPlayerReadyTimeout.bind(room), 10 * 1000);
  //  }
  //}
};

BaseRoomService.prototype.releaseTable = function(room, table) {
  var self = this;

  var index = room.tables.indexOf(table);
  if (index >= 0) {
    room.tables.splice(index, 1);
    delete room.tablesMap[table.tableId];
  }
  table.room = null;

  for (var playerIndex=0; playerIndex<table.players.length; playerIndex++) {
    var player = table.players[playerIndex];
    if (!!player) {
      player.reset();
      var pIndex = room.getReadyPlayerIndexByUserId(player.userId);
      if (pIndex >= 0) {
        room.readyPlayers.splice(pIndex, 1);
      }

      if (player.robot) {
        //this.robotService.releaseRobotPlayers([player]);
        self.theApp.rpc.robotServer.robotRemote.releaseRobotPlayers.toServer('*', [player], null);
        //room.idle_robots.push(player);
      }
    }
  }

  table.pokeGame = null;
  table.players.splice(0, table.players.length);
};



module.exports = BaseRoomService;