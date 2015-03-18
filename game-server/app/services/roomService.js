var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var GameRoom = require('../domain/gameRoom');
var utils = require('../util/utils');

var exp = module.exports;

var roomsMap = {};
var pomeloApp = null;

/**
 * 初始化房间信息
 * @param app
 * @param roomIds
 * @returns {*}
 */
exp.init = function(app, roomIds) {
  logger.info("roomIds: ", roomIds);
  pomeloApp = app;
  for (var index=0; index<roomIds.length; index++) {
    var roomId = roomIds[index];
    loadRoom(roomId, function(err, room) {
      if (!!room) {
        roomsMap[room.roomId] = room;
      } else {
        logger.error('[%s] [RoomService.init] failed to load room[id = %d] error:', pomeloApp.getServerId(), roomId, err );
      }
    });
  }

  return exp;
};

/**
 * 根据房间id获取房间实例。
 * @param roomId
 * @returns {*}
 */
exp.getRoom = function(roomId) {
  //logger.info("roomsMap: %j", roomsMap);
  return roomsMap[roomId];
};

/**
 * 重新加载房间信息
 * @param cb
 */
exp.reloadRooms = function(cb) {
  logger.info("[RoomService.reloadRooms] reload rooms...");
  for (var roomId in roomsMap) {
    var room = roomsMap[roomId];
    room.reloadFromDb();
  }

  utils.invokeCallback(cb);
};

/**
 * 玩家进入房间
 * @param player - 玩家
 * @param roomId - 房间id
 * @param lastTableId - 玩家上次进入时的table id
 * @param cb
 */
exp.enterRoom = function(player, roomId, lastTableId, cb) {
  var room = roomsMap[roomId];

  room.startNewGameCallback = cb;
//  if (!room.startNewGameCallback) {
//    room.startNewGameCallback = cb;
//  }

  room.enter(player, lastTableId);
  room.playerReady(player, function(table) {
    utils.invokeCallback(cb, table);
  });

  //var table = room.enter(player, lastTableId);

  // table.setupEvents(engine);
//  table.players.push(player);
//  player.tableId = table.tableId;

  //return table;
};


/**
 * 获取房间指定的table
 * @param roomId
 * @param tableId
 * @returns {*}
 */
exp.getTable = function(roomId, tableId) {
  var room = roomsMap[roomId];
  if (!room)
    return null;
  return room.tablesMap[tableId];
};

/**
 * 玩家离开房间
 * @param roomId
 * @param playerId
 * @param cb
 */
exp.leave = function(roomId, playerId, cb) {
  var room = roomsMap[roomId];
  var player = room.getPlayer(playerId);
  var table = room.getGameTable(player.tableId);
  if (!!table && !!table.pokeGame) {
    pomeloApp.get('cardService').gameOver(table, player, function() {
      utils.invokeCallback(cb, room.leave(playerId));
    });
  } else {
    utils.invokeCallback(cb, room.leave(playerId));
  }

};

/**
 * 加载房间
 * @param roomId
 * @param callback
 */
var loadRoom = function(roomId, callback) {

  GameRoom.findOne({roomId:roomId}, function(err, room) {
    if (!!room) {
      room.initRoom();
    } else {
      logger.error('[RoomService.init] failed to load room[id = %d] error:', roomId, err );
    }
    utils.invokeCallback(callback, err, room);
  });
};