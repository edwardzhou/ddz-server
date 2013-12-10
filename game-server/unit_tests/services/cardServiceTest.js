/**
 * Created by edwardzhou on 13-12-6.
 */

var CardService = require('../../app/services/cardService');
var GameRoom = require('../../app/domain/gameRoom');
var GameTable = require('../../app/domain/gameTable');
var Player = require('../../app/domain/player');
var StartGameAction = require('../../app/services/actions/startGame');
var GrabGameAction = require('../../app/services/actions/grabLord');
var PlayCardAction = require('../../app/services/actions/playCard');
var CheckSeqNoFilter = require('../../app/services/filters/checkSeqNo');
var IncreaseSeqNoFilter = require('../../app/services/filters/increaseSeqNo');
var CancelActionTimeoutFilter = require('../../app/services/filters/cancelActionTimeout');
var IncreasePlaysAfterFilter = require('../../app/services/filters/increasePlays');
var GameAction = require('../../app/consts/consts').GameAction;
var CardUtil = require('../../app/util/cardUtil');

var cardService = new CardService();

cardService.init(
  {
    messageService: {pushTableMessage: function() {}}
  }
);

function testStartGame() {

  CardUtil.buildCardTypes();

  var gameRoom = new GameRoom({roomId: 1, roomName: 'test room1'});
  //var table = new GameTable({tableId: 1});

  var table = gameRoom.enter(new Player({userId: 10001, nickName: 'user_10001', serviceId: 'a1'}))
  var t1 = gameRoom.enter(new Player({userId: 10002, nickName: 'user_10002', serviceId: 'a1'}))
  var t2 = gameRoom.enter(new Player({userId: 10003, nickName: 'user_10003', serviceId: 'a1'}))

  console.log(table == t1, t1 == t2);

  var msgService = {
    pushTableMessage: function(table, route, msg, cb) {
      console.log("pushTableMessage: ", arguments);
      console.log('msg: ', msg);
    },
    pushMessage: function(route, msg, uids, cb) {
      console.log("pushMessage: ", arguments);
      //console.log('pushMessage msg: ', msg);
    }
  };

  cardService.messageService = msgService;
//  cardService.startGameAction = { execute: function() {
//    console.log("startGameAction: %j", arguments);
//  }};
  cardService.startGameAction = StartGameAction;

  var beforeFilters = [CheckSeqNoFilter];
  var afterFilters = [IncreaseSeqNoFilter];
  cardService.configGameActionFilters(GameAction.GRAB_LORD, beforeFilters, afterFilters);
  cardService.grabLordAction = GrabGameAction;

  beforeFilters = [CheckSeqNoFilter, CancelActionTimeoutFilter];
  afterFilters = [IncreasePlaysAfterFilter, IncreaseSeqNoFilter]
  cardService.configGameActionFilters(GameAction.PLAY_CARD, beforeFilters, afterFilters);
  cardService.playCardAction = PlayCardAction;

  cardService.playerReady(table, table.players[0], function() {
  });
  cardService.playerReady(table, table.players[1], function() {
  });
  cardService.playerReady(table, table.players[2], function() {
  });

  var pokeGame = table.pokeGame;
  var player = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
  var seqNo = pokeGame.token.currentSeqNo;
  cardService.grabLord(table, player, 1, seqNo, function(err, result) {
    console.log('[grabLord] err: ', err);
    console.log('[grabLord] result: ', result);

    player = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
    seqNo = pokeGame.token.currentSeqNo;
    cardService.grabLord(table, player, 0, seqNo, function(err, result) {
      console.log('[2nd grabLord] err: ', err);
      console.log('[2nd grabLord] result: ', result);

      player = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
      seqNo = pokeGame.token.currentSeqNo;
      cardService.grabLord(table, player, 0, seqNo, function(err, result) {
        console.log('[3rd grabLord] err: ', err);
        console.log('[3rd grabLord] result: ', result);
      });
    });
  });

}

testStartGame();
