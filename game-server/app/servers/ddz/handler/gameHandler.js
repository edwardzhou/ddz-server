var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var GameTable = require('../../../domain/gameTable');
var utils = require('../../../util/utils');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.Handler created.");
  this.app = app;
};

Handler.prototype.ready = function(msg, session, next) {
  var room_id = session.get('room_id');
  var uid = session.uid;
  var sid = session.frontendId;

  this.app.rpc.area.gameRemote.readyGame(session, {uid: uid, serverId: sid, room_id: room_id}, function(err, data) {
    logger.info("[Connector.ready] area.gameRemote.readyGame returned: ", data);
    utils.invokeCallback(next, err, data);
    // next(null, data);
  });
};

Handler.prototype.grabLord = function(msg, session, next) {
  var room_id = session.get('room_id');
  var uid = session.uid;
  var sid = session.frontendId;
  var table_id = session.get('table_id');
  var lordAction = msg.lordAction;
  var seqNo = msg.seqNo;

  var params = {
    uid: uid,
    serverId: sid,
    room_id: room_id,
    table_id: table_id,
    lordAction: lordAction,
    seqNo: seqNo
  };

  this.app.rpc.area.gameRemote.grabLord(session, params, function(err, data) {
    utils.invokeCallback(next, err, data);
  });

};

Handler.prototype.playCard = function(msg, session, next) {
  var room_id = session.get('room_id');
  var uid = session.uid;
  var sid = session.frontendId;
  var table_id = session.get('table_id');
  var card = msg.card;
  var seqNo = msg.seqNo;

  var params = {
    uid: uid,
    serverId: sid,
    room_id: room_id,
    table_id: table_id,
    seqNo: seqNo,
    card: card
  };

  logger.debug('[playCard] msg => %j', msg);

  this.app.rpc.area.gameRemote.playCard(session, params, function(err, data) {
    utils.invokeCallback(next, err, data);
  });

};

Handler.prototype.cancelDelegate = function(msg, session, next) {
  var room_id = session.get('room_id');
  var uid = session.uid;
  var sid = session.frontendId;
  var table_id = session.get('table_id');

  var params = {
    uid: uid,
    serverId: sid,
    room_id: room_id,
    table_id: table_id
  };

  logger.debug('[cancelDelegate] msg => %j， params => %j', msg, params);

  this.app.rpc.area.gameRemote.cancelDelegate(session, params, function(err, data) {
    logger.debug('[cancelDelegate] gameRemote.cancelDelegate returns %j', data);
    utils.invokeCallback(next, err, data);
  });

};

Handler.prototype.restoreGame = function(msg, session, next) {
  logger.debug('[GameHandler.restoreGame] session: ' , session);
  var room_id = session.get('room_id');
  var table_id = session.get('table_id');
  var uid = session.uid;
  var sid = session.frontendId;
  var msgNo = msg.msgNo || -1;
  this.app.rpc.area.roomRemote.reenter(session, uid, sid, session.id, room_id, table_id, msgNo, function(err, data) {
    utils.invokeCallback(next, err, data);
  });
};