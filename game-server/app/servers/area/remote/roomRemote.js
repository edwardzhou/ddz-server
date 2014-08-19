var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var roomDao = require('../../../dao/roomDao');
var roomService = require('../../../services/roomService');
var messageService = require('../../../services/messageService');
var Player = require('../../../domain/player');
var PlayerState = require('../../../consts/consts').PlayerState;
var UserSession = require('../../../domain/userSession');
var format = require('util').format;
var utils = require('../../../util/utils');
var cardService = require('../../../services/cardService');
var ErrorCode = require('../../../consts/errorCode');
var userDao = require('../../../dao/userDao');
var GameState = require('../../../consts/consts').GameState;

module.exports = function(app) {
  return new RoomRemote(app);
};

/**
 * 房间远程接口
 * @param app
 * @constructor
 */
var RoomRemote = function(app) {
  this.app = app;
  // this.tableService = app.get('tableService');
  this.channelService = app.get('channelService');
  this.sessionService = app.get('localSessionService');
  this.cardService = app.get('cardService');
  this._onStartNewGame = this.onStartNewGame.bind(this);
};

var remoteHandler = RoomRemote.prototype;

remoteHandler.tryEnter = function(uid, sid, sessionId, room_id, cb) {
  var self = this;
  var thisServerId = self.app.getServerId();
  utils.invokeCallback(cb, null, thisServerId, {ret: ErrorCode.SUCCESS});
};

/**
 * 玩家进入房间
 * @param uid - 玩家id
 * @param sid - 玩家所在的前端服务器id
 * @param sessionId - 会话id
 * @param room_id - 要进入的房间id
 * @param cb - 回调
 */
remoteHandler.enter = function(uid, sid, sessionId, room_id, cb) {
  var self = this;
  var thisServerId = self.app.getServerId();

  userDao.getByUserId(uid, function(err, user) {
    if (err) {
      utils.invokeCallback(cb, null, thisServeId, {ret: ErrorCode.USER_NOT_FOUND});
    }

    var player = new Player(user);
    player.serverId = sid;

    UserSession.getByUserId(player.userId, function(err, userSession) {
      player.userSession = userSession;

//      // 进入房间，并取得玩家所属桌子
//      var table = roomService.enterRoom(new Player(player), room_id, -1);
//      // cardServer挂接table的playerReady事件
//      //utils.on(table, "playerReady", cardService.onPlayerReady);
//
//      player.userSession.sset('roomId', table.room.roomId);
//      player.userSession.sset('tableId', table.tableId);
//
//      var msg = table.toParams();
//      msg.timing = 10;
//
//      // 通知桌子的其他玩家，有新玩家进入
//      process.nextTick(function() {
//        messageService.pushTableMessage(table, "onPlayerJoin", msg, null);
//      });

      roomService.enterRoom(player, room_id, -1, self._onStartNewGame);

      // 返回结果
      cb(null, thisServerId, {});

    });
  });

};

remoteHandler.onStartNewGame = function(table) {
  var self = this;

  for (var index=0; index<table.players.length; index++) {
    var p = table.players[index];
    if (!p.robot) {
      p.userSession.sset('roomId', table.room.roomId);
      p.userSession.sset('tableId', table.tableId);
    }
  }
  var msg = table.toParams();
  process.nextTick(function() {
    messageService.pushTableMessage(table, "onPlayerJoin", msg, function() {
      self.cardService.startGame(table);
    });
  });
}

remoteHandler.reenter = function(uid, sid, sessionId, room_id, table_id, msgNo, cb) {
  var player = roomService.getRoom(room_id).getPlayer(uid);
  var table = roomService.getTable(room_id, table_id);

  console.log('[remoteHandler.reenter] client msgNo: ', msgNo);
  if (!!player) {
    if (!!player.connectionRestoreTimeout) {
      clearTimeout(player.connectionRestoreTimeout);
      player.connectionRestoreTimeout = null;
    }
    player.connectionLost = false;
    player.serverId = sid;

    if (!!table.pokeGame) {
      var playerMsgs = table.pokeGame.playerMsgs[uid];
      process.nextTick(function() {
        for (var index=0; index<playerMsgs.length; index++) {
          var msg = playerMsgs[index];
          if (msg[1].msgNo > msgNo) {
            messageService.pushMessage(msg[0], msg[1], [player.getUidSid()], null);
          }
        }
      });
    }
    cb(null, []);
  } else {
    cb(null, []);
  }
};

/**
 * 玩家离开房间
 * @param msg
 * @param cb
 */
remoteHandler.leave = function(msg, cb) {
  var uid = msg.uid;
  var room_id = msg.room_id;

  var room = roomService.getRoom(room_id);
  if (!room) {
    utils.invokeCallback(cb, null, null);
    return;
  }

  var hasGame = false;
  var player = roomService.getRoom(room_id).getPlayer(uid);
  if (!!player) {
    var table = room.getGameTable(player.tableId);
    hasGame = (!!table && !!table.pokeGame);
    var self_close = msg.self_close;

    var leaveFunc = function () {
      roomService.leave(room_id, uid, function (table) {
//        if (table.gameSate != GameState.PENDING_FOR_READY) {
//          table.reset();
//        }
//
//        //setTimeout(table, "")
//        process.nextTick(function () {
//          messageService.pushTableMessage(table, "onPlayerJoin", table.toParams(), null);
//        });
      });
    };

//  UserSession.getByUserId(uid, function(err, userSession) {
//
//  });


    if (!self_close && hasGame) {
      player.connectionLost = true;
//    cardService.playerConnectionLost(table, player, function(){
//
//    });
      player.connectionRestoreTimeout = setTimeout(leaveFunc, 120 * 1000);
    } else {
      leaveFunc();
    }
  }
  utils.invokeCallback(cb, null, null);

};

var getPlayerIds = function(table) {
  var ids = [];
  for(var index=0; index<table.players.length; index++) {
    var player = table.players[index];
    ids.push({uid: player.userId, sid: player.serverId});
  }
  return ids;
};

remoteHandler.queryRooms = function(msg, cb) {
  logger.info('[%s] [remoteHandler.queryRooms] msg => ', this.app.getServerId(), msg);
  roomDao.getActiveRooms(function(err, rooms) {
    cb(err, rooms);
  });
};