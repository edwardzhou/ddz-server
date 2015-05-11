var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var roomDao = require('../../../dao/roomDao');
//var roomService = require('../../../services/roomService');
var messageService = require('../../../services/messageService');
var cardService = require('../../../services/cardService');
var Player = require('../../../domain/player');
var PlayerState = require('../../../consts/consts').PlayerState;
var utils = require('../../../util/utils');
var format = require('util').format;
var Result = require('../../../domain/result');

module.exports = function(app) {
  return new GameRemote(app);
};

var GameRemote = function(app) {
  this.app = app;
  // this.tableService = app.get('tableService');
  this.channelService = app.get('channelService');
  this.sessionService = app.get('localSessionService');
  this.cardService = app.get('cardService');
  this.roomService = app.get('roomService');
};

var remoteHandler = GameRemote.prototype;

remoteHandler.readyGame = function(msg, cb) {
  var self = this;

  var uid = msg.uid;
  var sid = msg.serverId;
  var room_id = msg.room_id;

  var room = this.roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  //var table = room.getGameTable(player.tableId);

  this.roomService.playerReady(room, player, function(err, table, startNewGame) {

    //for (var index=0; index<table.players.length; index++) {
    //  var p = table.players[index];
    //  var data = {
    //    roomId: table.room.roomId,
    //    tableId: table.tableId,
    //    gameId: null};
    //  if (!!table.pokeGame) {
    //    data.gameId = table.pokeGame.gameId;
    //  }
    //  p.userSession.sset(data);
    //}
    //var msg = table.toParams();
    //process.nextTick(function() {
    //  messageService.pushTableMessage(table, "onPlayerJoin", msg, function() {
    //    //if (startNewGame) {
    //    //  self.cardService.startGame(table);
    //    //}
    //  });
    //});
  });

  utils.invokeCallback(cb, null, {result: 0});
};

remoteHandler.grabLord = function(msg, cb) {
  var uid = msg.uid;
  var sid = msg.serverId;
  var room_id = msg.room_id;
  var table_id = msg.table_id;
  var lordAction = msg.lordAction;
  var seqNo = msg.seqNo;

  var room = this.roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  var table = room.getGameTable(player.tableId);

  this.cardService.grabLord(table, player, lordAction, seqNo, function(err, result){
    utils.invokeCallback(cb, err, result);
  });
};

remoteHandler.playCard = function(msg, cb) {
  var uid = msg.uid;
  var sid = msg.serverId;
  var room_id = msg.room_id;
  var table_id = msg.table_id;
  var card = msg.card;
  var seqNo = msg.seqNo;

  var room = this.roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  var table = room.getGameTable(player.tableId);

  this.cardService.playCard(table, player, card, seqNo, false, function(err, data) {
    utils.invokeCallback(cb, err, data);
  });
};

remoteHandler.cancelDelegate = function(msg, cb) {
  var uid = msg.uid;
  var sid = msg.serverId;
  var room_id = msg.room_id;
  var table_id = msg.table_id;

  var room = this.roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  var table = room.getGameTable(player.tableId)

  this.cardService.cancelDelegating(table, player, function(){
    utils.invokeCallback(cb, null, {result: new Result(0)});
  });
  //player.delegating = false;


};


remoteHandler.setDelegate = function(msg, cb) {
  var uid = msg.uid;
  var sid = msg.serverId;
  var room_id = msg.room_id;
  var table_id = msg.table_id;

  var room = this.roomService.getRoom(room_id);
  var player = room.getPlayer(uid);
  var table = room.getGameTable(player.tableId)

  this.cardService.setDelegating(table, player, function(){
    utils.invokeCallback(cb, null, {result: new Result(0)});
  });
  //player.delegating = false;


};