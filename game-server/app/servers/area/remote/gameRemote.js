var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var roomDao = require('../../../dao/roomDao');
var roomService = require('../../../services/roomService');
var messageService = require('../../../services/messageService');
var Player = require('../../../domain/player');
var PlayerState = require('../../../consts/consts').PlayerState;
var format = require('util').format;

module.exports = function(app) {
  return new GameRemote(app);
};

var GameRemote = function(app) {
  this.app = app;
  // this.tableService = app.get('tableService');
  this.channelService = app.get('channelService');
  this.sessionService = app.get('localSessionService');
};

var remoteHandler = GameRemote.prototype;

remoteHandler.readyGame = function(msg, cb) {

  // logger.info("msg: %j", msg);

  var uid = msg.uid;
  var sid = msg.serverId;
  var room_id = msg.room_id;

  var room = roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  var table = room.getGameTable(player.tableId);
  // player.state = PlayerState.ready;
  player.ready();

  messageService.pushTableMessage(this.app, table, "onPlayerJoin", table.toParams(), null);

  cb(null, null);
};
