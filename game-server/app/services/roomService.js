var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var GameRoom = require('../domain/gameRoom');

var exp = module.exports;

var roomsMap = {};

exp.init = function(app, roomIds) {
  logger.info("roomIds: ", roomIds);

  for (var index=0; index<roomIds.length; index++) {
    var roomId = roomIds[index];
    roomsMap[roomId] = loadRoom(roomId);
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

exp.leave = function(roomId, playerId) {
  var room = roomsMap[roomId];
  return room.leave(playerId);
};

var loadRoom = function(roomId) {
  return new GameRoom({roomId:roomId, roomName: 'room_' + roomId})
};