var logger = require('pomelo-logger').getLogger(__filename);
var roomDao = require('../../../dao/roomDao');
var tableService = require('../../../services/tableService');
var format = require('util').format;

module.exports = function(app) {
  return new RoomRemote(app);
};

var _tables = {};


var RoomRemote = function(app) {
  this.app = app;
  this.tableService = app.get('tableService');
  this.channelService = app.get('channelService');
};

var remoteHandler = RoomRemote.prototype;

remoteHandler.enter = function(uid, sid, room_id, cb) {
  var player = {userId: uid, nickName: "user_001"};
  var table = tableService.arrangeTable(null, 0);
  table.players.push(player);

  var channelName = format('r_%d_t_%d', room_id, table.tableId);
  var channel = this.channelService.getChannel(channelName, true);
  channel.add(uid, sid);

  logger.info("[<%s> RoomRemote.enter] uid: %s, sid: %s, room_id: %s", this.app.getServerId(), uid, sid, room_id);
  logger.info("[<%s> RoomRemote.enter] table: %j", this.app.getServerId(), table);

  channel.pushMessage('onPlayerJoin', table, function(err){
    if (!!err)
      logger.error("got error: %j" , err);
  });

  var this_server_id = this.app.getServerId();
  cb(this_server_id, table);
};

remoteHandler.queryRooms = function(cb) {
  roomDao.getActiveRooms(function(err, rooms) {
    cb(rooms);
  });
};