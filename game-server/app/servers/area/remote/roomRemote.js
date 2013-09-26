var logger = require('pomelo-logger').getLogger(__filename);
var roomDao = require('../../../dao/roomDao');
var tableService = require('../../../services/tableService');
var Player = require('../../../domain/player');
var format = require('util').format;

module.exports = function(app) {
  return new RoomRemote(app);
};

var _tables = {};


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
  var table = tableService.arrangeTable(null, 0);
  table.players.push(new Player(player));

  var thisServerId = self.app.getServerId();

  var channelName = format('r_%d_t_%d', room_id, table.tableId);
  var channel = this.channelService.getChannel(channelName, true);
  channel.add(uid, sid);

  //logger.info("[<%s> RoomRemote.enter] this.sessionService: ", thisServerId, this.sessionService);
  //logger.info("[<%s> RoomRemote.enter] this.sessionService: ", thisServerId, this.sessionService.getByUid);

  this.sessionService.get(sid, sessionId, function(err, localSession) {
    //logger.info("[<%s> RoomRemote.enter] localSession: ", thisServerId, localSession);
    localSession.set('tableChannel', channelName);
    localSession.set('table_id', table.tableId);
    localSession.push('table_id', null);
    localSession.push('tableChannel', function(err) {

      logger.info("[<%s> RoomRemote.enter] uid: %s, sid: %s, room_id: %s",
        self.app.getServerId(), uid, sid,  room_id);
      logger.info("[<%s> RoomRemote.enter] table: %j", thisServerId, table.toParams());

      channel.pushMessage('onPlayerJoin', table.toParams(), function(err){
        if (!!err)
          logger.error("got error: %j" , err);
      });

      cb(null, thisServerId, table);
    });

  });

//  logger.info("[<%s> RoomRemote.enter] uid: %s, sid: %s, room_id: %s",
//    this.app.getServerId(), uid, sid,  room_id);
//  logger.info("[<%s> RoomRemote.enter] table: %j", thisServerId, table);
//
//  channel.pushMessage('onPlayerJoin', table, function(err){
//    if (!!err)
//      logger.error("got error: %j" , err);
//  });
//
//  cb(null, thisServerId, table);
};

remoteHandler.leave = function(msg, cb) {
  var self = this;
  var channelName = msg.channelName;
  var table_id = msg.table_id;
  var sid = msg.sid;
  var uid = msg.uid;
  var room_id = msg.room_id;

  var table = tableService.getTable(table_id);
  table.removePlayer(uid);

  var ids = [];
  for(var index in table.players) {
    var player = table.players[index];
    ids.push({uid: player.userId, sid: player.serverId});
  }

  if (ids.length > 0)
    self.channelService.pushMessageByUids("onPlayerJoin", table.toParams(), ids, null);

//  logger.info("channelName: %s", channelName);
//  var channel = self.channelService.getChannel(channelName, true);
//  channel.leave(sid, uid);
//  channel.pushMessage('onPlayerJoin', table, function(err) {
//  });
};


remoteHandler.queryRooms = function(cb) {
  roomDao.getActiveRooms(function(err, rooms) {
    cb(rooms);
  });
};