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
  var lordValue = msg.lordValue;
  var seqNo = msg.seqNo;

  var params = {
    uid: uid,
    serverId: sid,
    room_id: room_id,
    table_id: table_id,
    lordValue: lordValue,
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