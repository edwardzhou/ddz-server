var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var GameTable = require('../../../domain/gameTable');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.Handler created.");
  this.app = app;
};

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.entry = function(msg, session, next) {
  var msgBody = format("[%s]: game server is ok.\n", this.app.getServerId());
  next(null, {code: 200, msg: msgBody});
};

Handler.prototype.queryRooms = function(msg, session, next) {
  this.app.rpc.area.roomRemote.queryRooms(session, function(err, rooms) {
     next(null, rooms);
  });
};

Handler.prototype.enterRoom = function(msg, session, next) {
  var self = this;
  var room_id = msg.room_id;
  var uid = msg.uid;
  var username = msg.username;

  logger.info('session ' , session.__proto__);

  var user = getUser(uid);

  session.bind(uid);
  session.set("room_id", room_id);
  session.pushAll( function(err) {
     if (err) {
       console.error('set room_id for session service failed! error is : %j', err.stack);
     }
  });

  var server_id = self.app.getServerId();

  session.on('closed', onUserLeave.bind(null, self.app));

  this.app.rpc.area.roomRemote.enter(session, uid, this.app.get('serverId'), session.id, room_id, function(err, room_server_id, table) {
    logger.info('enter result: ', err, room_server_id, table);
    if (!!err) {
      next(null, err);
      return;
    }

    table = new GameTable(table);
    session.set('table_id', table.tableId);
    session.push('table_id', null);
    logger.info("[enterRoom] area.roomRemote.enter return: room_server_id: %s, users: %j", room_server_id, table.toParams());
    var resp = {
      table: table.toParams(),
      room_server_id: room_server_id,
      server_id: server_id
    };

    next(null, resp);
  });

};

Handler.prototype.leave = function(msg, session, next) {

  session.set('self_close', true);
  session.push('self_close');

  this.app.get('sessionService').kickBySessionId( session.id );

  next(null, null);
};

var getUser = function(uid) {
//  return {
//    uid: uid,
//
//  };
};

var onUserLeave = function(app, session) {
  if (!session || !session.uid) {
    return;
  }

  var msg = {
    room_id: session.get('room_id'),
    table_id: session.get('table_id'),
    uid: session.uid,
    sid: session.frontendId,
    self_close: session.get('self_close') || false,
    channelName: session.get('tableChannel')
  };

  logger.debug('onUserLeave: ' , msg);

  app.rpc.area.roomRemote.leave(session, msg, null );
};


