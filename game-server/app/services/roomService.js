var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var GameRoom = require('../domain/gameRoom');
var utils = require('../util/utils');
var cardService = require('./cardService');

var exp = module.exports;

var roomsMap = {};
var pomeloApp = null;

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

exp.getRoom = function(roomId) {
  //logger.info("roomsMap: %j", roomsMap);
  return roomsMap[roomId];
};

exp.enterRoom = function(player, roomId, lastTableId) {
  var room = roomsMap[roomId];

  var table = room.enter(player, lastTableId);
  // table.setupEvents(engine);
//  table.players.push(player);
//  player.tableId = table.tableId;

  return table;
};

exp.getTable = function(roomId, tableId) {
  var room = roomsMap[roomId];
  if (!room)
    return null;
  return room.tablesMap[tableId];
};

exp.leave = function(roomId, playerId, cb) {
  var room = roomsMap[roomId];
  var player = room.getPlayer(playerId);
  var table = room.getGameTable(player.tableId);
  if (!!table.pokeGame) {
    pomeloApp.get('cardService').gameOver(table, player, function() {
      utils.invokeCallback(cb, room.leave(playerId));
    });
  } else {
    utils.invokeCallback(cb, room.leave(playerId));
  }

};

var loadRoom = function(roomId, callback) {

  GameRoom.findOne({roomId:roomId}, function(err, room) {
    if (!!room) {
      room.initRoom();
    } else {
      logger.error('[RoomService.init] failed to load room[id = %d] error:', roomId, err );
    }
    utils.invokeCallback(callback, err, room);
  });
//
//  var room = new GameRoom({roomId:roomId, roomName: 'room_' + roomId});
//  room.initRoom();
//
//  return room;
};