var utils = require('../util/utils');
var pomelo = require('pomelo');
var GameRoom = require('../domain/gameRoom');
var roomDao = module.exports;

roomDao.getActiveRooms = function(cb) {
//  var cursor = pomelo.app.get('dbclient').collection('gameRooms').find({active: true});
//  var rooms = [];
//  cursor.toArray(function(err, roomArray) {
//    for (var index=0; index<roomArray.length; index++) {
//      rooms.push(new GameRoom(roomArray[index]));
//    }
//    utils.invokeCallback(cb, null, rooms);
//  });
  GameRoom.find({}, function(err, roomDocs) {
    var rooms = [];
    for (var index in roomDocs) {
      rooms.push(roomDocs[index].toParams());
    }
    utils.invokeCallback(cb, null, rooms);
  });
};