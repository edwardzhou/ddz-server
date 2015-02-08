var format = require('util').format;
var utils = require('../../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);
var GameTable = require('../../../domain/gameTable');
var Result = require('../../../domain/result');
var ErrorCode = require('../../../consts/errorCode');
var Q = require('q');
var userService = require('../../../services/userService');
var quitQ = Q.nbind(userService.quit, userService);
var updateSessionQ = Q.nbind(userService.updateSession, userService);

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
  logger.info('[Handler.prototype.queryRooms] msg => ', msg);
  this.app.rpc.area.roomRemote.queryRooms.toServer('room-server', {}, function(err, rooms) {
    logger.info('this.app.rpc.area.roomRemote.queryRooms returns : ', err, rooms);
     next(null, {rooms: rooms});
  });


};

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.tryEnterRoom = function(msg, session, next) {
  var self = this;
  var room_id = msg.room_id;
  var uid = session.uid;


  session.set("room_id", room_id);
  session.pushAll( function(err) {
    if (err) {
      console.error('set room_id for session service failed! error is : %j', err.stack);
    }
  });

  this.app.rpc.area.roomRemote.tryEnter(session, uid, this.app.get('serverId'), session.id, room_id, function(err, room_server_id, result) {
    logger.info('enter result: ', err, room_server_id, result);
    if (!!err) {
      next(null, {err: err});
      return;
    }

    next(null, result);
  });
};



Handler.prototype.enterRoom = function(msg, session, next) {
  var self = this;
  var room_id = msg.room_id;
  var uid = session.uid;
  var username = msg.username;

  logger.info('session ' , session.__proto__);

  var user = getUser(uid);

  //session.bind(uid);
  session.set("room_id", room_id);
  session.pushAll( function(err) {
     if (err) {
       console.error('set room_id for session service failed! error is : %j', err.stack);
     }
  });

  var server_id = self.app.getServerId();

  if (!session.get('closed_binded')) {
    session.on('closed', onUserLeave.bind(null, self.app));
    session.set('closed_bound', true);
    session.push('closed_bound');
  }

  this.app.rpc.area.roomRemote.enter(session, uid, this.app.get('serverId'), session.id, room_id, function(err, room_server_id, table) {
    logger.info('enter result: ', err, room_server_id, table);
    if (!!err) {
      next(null, {err: err});
      return;
    }

    //table = new GameTable(table);
//    session.set('table_id', table.tableId);
//    session.push('table_id', null);
//    logger.info("[enterRoom] area.roomRemote.enter return: room_server_id: %s, users: %j",
//      room_server_id,
//      GameTable.toParams(table));
//    var resp = {
//      table: GameTable.toParams(table),
//      room_server_id: room_server_id,
//      server_id: server_id,
//      timing: table.timing
//    };
    var resp = {};
    resp.result = new Result(ErrorCode.SUCCESS);


    logger.info("[enterRoom] area.roomRemote.enter return resp: %j", resp);


    next(null, resp);
  });

};

Handler.prototype.restoreGame = function(msg, session, next) {
  logger.debug('[GameHandler.restoreGame] session: ' , session);
  var room_id = session.get('room_id');
  var table_id = session.get('table_id');
  var uid = session.uid;
  var sid = session.frontendId;
  var msgNo = msg.msgNo;
  this.app.rpc.area.roomRemote.reenter(session, uid, sid, session.id, room_id, table_id, msgNo, function(err, data) {
    utils.invokeCallback(next, err, data);
  });
};

Handler.prototype.leave = function(msg, session, next) {

  session.set('self_close', true);
  session.push('self_close');

  onUserLeave(this.app, session);
  //this.app.get('sessionService').kickBySessionId( session.id );

  next(null, null);
};

Handler.prototype.updateUserInfo = function(msg, session, next) {
  msg.frontendId = session.frontendId;
  msg.sessionId = session.id;
  this.app.rpc.userSystem.userRemote.updateUserInfo(session, msg, function(err, result) {
    next(null, result);
  });
};

Handler.prototype.ackPreStartGame = function(msg, session, next) {
  var self = this;
  var room_id = msg.roomId;
  var uid = session.uid;
  var table_id = msg.tableId;

  this.app.rpc.area.roomRemote.ackPreStartGame(session, uid, this.app.get('serverId'), session.id, room_id, table_id, function(err) {
    logger.info('ackPreStartGame result: ', err);
    if (!!err) {
      next(null, {err: err});
      return;
    }
    var resp = {};
    resp.result = new Result(ErrorCode.SUCCESS);
    logger.info("[enterRoom] area.roomRemote.ackPreStartGame return resp: %j", resp);

    next(null, resp);
  });

};

Handler.prototype.quit = function(msg, session, next) {
  var self = this;
  var userId = session.get('userId');
  quitQ(userId)
      .then(function(){
        utils.invokeCallback(callback, null, {result: true});
      })
      .fail(function(error){
        utils.invokeCallback(callback, null, {result: false, err: error});
      });

};

Handler.prototype.ddz.entryHandler.updateSession = function(msg, session, next) {
  var self = this;
  var userId = session.get('userId');
  updateSessionQ(userId)
      .then(function(){
        utils.invokeCallback(callback, null, {result: true});
      })
      .fail(function(error){
        utils.invokeCallback(callback, null, {result: false, err: error});
      });

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

  var roomId = session.get('room_id');
//  var tableId = session.get('table_id');
//  if (!roomId || !tableId) {
//    return;
//  }

  var msg = {
    room_id: session.get('room_id'),
//    table_id: session.get('table_id'),
    uid: session.uid,
    sid: session.frontendId,
    self_close: session.get('self_close') || false,
    channelName: session.get('tableChannel')
  };

  logger.debug('onUserLeave: ' , msg);

  app.rpc.area.roomRemote.leave(session, msg, function() {
    session.set('room_id', null);
    session.set('table_id', null);
    session.pushAll();
  });
};


