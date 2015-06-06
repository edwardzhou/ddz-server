/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var format = require('util').format;
var utils = require('../../../util/utils');
var logger = require('pomelo-logger').getLogger(__filename);
var GameTable = require('../../../domain/gameTable');
var GameRoom = require('../../../domain/gameRoom');
var User = require('../../../domain/user');
var DdzProfile = require('../../../domain/ddzProfile');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');
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
 * 尝试进入合适/指定的房间.
 * 需要满足测试条件:
 *  玩家的金币, 必须在房间的金币上下限范围内.
 *  如果, 金币过少, 返回合适的道具包, 提示玩家充值
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
Handler.prototype.tryEnterRoom = function(msg, session, next) {
  var self = this;
  // room_id 为 null 或 <=0 , 则代表自动为玩家匹配合适的房间
  // room_id > 0, 则表示玩家想进入该房间
  var room_id = msg.room_id;
  var table_id = msg.table_id || -1;
  var uid = session.uid;
  var results = {};

  session.set('room_id', room_id);
  session.push('room_id');

  logger.debug('[EntryHandler.tryEnterRoom] msg:', msg);

  DdzProfile.findOneQ({userId: uid})
    .then(function(u) {
      results.ddzProfile = u;
      return GameRoom.getActiveRoomsQ(room_id);
    })
    .then(function(rooms) {
      // 如果要进入的房间不存在
      if (rooms == null || rooms.length == 0) {
        // 则选出所有房间, 尝试为用户匹配合适的房间
        return GameRoom.getActiveRoomsQ();
      }

      return rooms;
    })
    .then(function(rooms){
      results.rooms = rooms;

      var ddzProfile = results.ddzProfile;

      for (var index=0; index<results.rooms.length; index++) {
        var room = results.rooms[index];
        if (room.minCoinsQty <= ddzProfile.coins && room.maxCoinsQty > ddzProfile.coins) {
          results.room = room;
          break;
        }
      }
    })
    .then(function(){
      if (!results.room) {
        // 没有可进入的房间
        // 返回 充值 道具包
        return DdzGoodsPackage.findOneQ({packageId: results.rooms[0].recruitPackageId});
      }

      return null;
    })
    .then(function(ddzPkg) {
      if (!!ddzPkg) {
        results.ddzGoodsPackage = ddzPkg;
      }
    })
    .then(function(){
      if (!!results.room) {
        room_id = results.room.roomId;
        session.set("room_id", room_id);
        session.pushAll( function(err) {
          if (err) {
            console.error('set room_id for session service failed! error is : %j', err.stack);
          }

        });

        self.app.rpc.area.roomRemote.tryEnter(session, uid, self.app.get('serverId'), session.id, room_id, table_id, function(err, room_server_id, result) {
          logger.info('enter result: ', err, room_server_id, result);
          if (!!err) {
            var errResp = new Result(ErrorCode.SYSTEM_ERROR, 0, err.toString());
            errResp.error = err;
            next(null, errResp);
            return;
          }

          result.room = results.room.toParams();

          next(null, result);
        });

      } else {
        var resp = new Result(ErrorCode.COINS_NOT_ENOUGH, 0, '金币不足!');
        resp.recruitMsg = format('您要进入的[%s]要求金币数至少在%d以上, 是否充值进入?\n%s ￥%s元\n%s',
          results.rooms[0].roomName, results.rooms[0].minCoinsQty, results.ddzGoodsPackage.packageName,
          results.ddzGoodsPackage.price / 100,
          results.ddzGoodsPackage.packageDesc);
        resp.pkg = results.ddzGoodsPackage.toParams();
        resp.room = results.rooms[0].toParams();
        next(null, resp);
      }
    })
    .fail(function(err) {
      next(null, {err: err});
    });

};



Handler.prototype.enterRoom = function(msg, session, next) {
  var self = this;
  var room_id = msg.room_id;
  var table_id = msg.table_id || -1;
  var uid = session.uid;
  var username = msg.username;

  //logger.info('session ' , session.__proto__);

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

  this.app.rpc.area.roomRemote.enter(session, uid, this.app.get('serverId'), session.id, room_id, table_id, function(err, room_server_id, room) {
    logger.info('enter result: ', err, room_server_id, room);
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
    resp.room = room;


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

Handler.prototype.updateSession = function(msg, session, next) {
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


