var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var roomDao = require('../../../dao/roomDao');
var roomService = require('../../../services/roomService');
var messageService = require('../../../services/messageService');
var Player = require('../../../domain/player');
var format = require('util').format;
var utils = require('../../../util/utils');
var cardService = require('../../../services/cardService');

module.exports = function(app) {
  return new RoomRemote(app);
};

var RoomRemote = function(app) {
  this.app = app;
  // this.tableService = app.get('tableService');
  this.channelService = app.get('channelService');
  this.sessionService = app.get('localSessionService');
};

var remoteHandler = RoomRemote.prototype;

remoteHandler.enter = function(uid, sid, sessionId, room_id, cb) {
  var self = this;
  var player = {userId: uid, nickName: "user_001", serverId: sid};

  var table = roomService.enterRoom(new Player(player), room_id, -1);

  utils.on(table, "playerReady", cardService.onPlayerReady);

  var thisServerId = self.app.getServerId();

  messageService.pushTableMessage(self.app, table, "onPlayerJoin", table.toParams(), null);

//  var ids = getPlayerIds(table);
//  process.nextTick( function() {
//    if (ids.length > 0)
//      self.channelService.pushMessageByUids("onPlayerJoin", table.toParams(), ids, null);
//  });
  cb(null, thisServerId, table);

};

remoteHandler.leave = function(msg, cb) {
  var self = this;
  var channelName = msg.channelName;
  var table_id = msg.table_id;
  var sid = msg.sid;
  var uid = msg.uid;
  var room_id = msg.room_id;

  var room = roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  var table = roomService.leave(room_id, uid);
  table.reset();
  // table.removePlayer(uid);

  messageService.pushTableMessage(self.app, table, "onPlayerJoin", table.toParams(), null);
//  var ids = getPlayerIds(table);
//  if (ids.length > 0)
//    self.channelService.pushMessageByUids("onPlayerJoin", table.toParams(), ids, null);

};

var getPlayerIds = function(table) {
  var ids = [];
  for(var index in table.players) {
    var player = table.players[index];
    ids.push({uid: player.userId, sid: player.serverId});
  }
  return ids;
};

remoteHandler.queryRooms = function(cb) {
  roomDao.getActiveRooms(function(err, rooms) {
    cb(rooms);
  });
};