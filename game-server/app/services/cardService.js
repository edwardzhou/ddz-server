var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var utils = require('../util/utils');
var cardUtil = require('../util/cardUtil');
var GameRoom = require('../domain/gameRoom');
var GameTable = require('../domain/gameTable');
var Player = require('../domain/player');
var messageService = require('./messageService');
var PokeCard = require('../domain/pokeCard');

var exp = module.exports;

var theApp = null;

exp.init = function (app) {
  theApp = app;
};

exp.onPlayerReady = function (table, player, cb) {
  logger.info("onPlayerReady");
  messageService.pushTableMessage(table, "onPlayerJoin", table.toParams(), null );

  if ( (table.players.length == 3) &&
    table.players[0].isReady() && table.players[1].isReady() && table.players[2].isReady) {
    exp.startGame(table);
  }
};

exp.startGame = function (table, cb) {

  var pokeCards = PokeCard.shuffle();
  var pokeCards1 = [];
  var pokeCards2 = [];
  var pokeCards3 = [];

  while(pokeCards.length>3) {
    pokeCards1.push(pokeCards.shift());
    pokeCards2.push(pokeCards.shift());
    pokeCards3.push(pokeCards.shift());
  };

  var _sortPokeCard = function(p1, p2) {
    return p1.pokeIndex - p2.pokeIndex;
  };

  table.players[0].setPokeCards(pokeCards1.sort(_sortPokeCard));
  table.players[1].setPokeCards(pokeCards2.sort(_sortPokeCard));
  table.players[2].setPokeCards(pokeCards3.sort(_sortPokeCard));

  table.lordPokeCards = pokeCards.sort(_sortPokeCard);

  var newPokeGame = PokeGame.newGame(table.room.getRoomId(), table.tableId, table.players);
  newPokeGame.lordPokeCards = cardUtil.pokeCardsToString(table.lordPokeCards);

  table.game = newPokeGame;

  var lordUserIndex = (new Date()).getTime() % 3;
  var lordUserId = table.players[lordUserIndex].userId;
  table.nextUserId = lordUserId;
  table.lastUserId = null;

  for (var index=0; index<table.players.length; index ++) {
    var player = table.players[index];
    messageService.pushMessage("onGameStart",
      {
        player: player.toParams(),
        grabLord: (player.userId == lordUserId ? 1 : 0),
        pokeCards: player.pokeCardsString()
      },
      [player.getUidSid()],
      null);
  }
};

exp.grabLord = function(table, player, lordValue, cb) {
  if (table.nextUserId != player.userId) {
    utils.invokeCallback(cb, {err: 1001}, null);
    return;
  }

  if (lordValue <= table.lordValue) {
    utils.invokeCallback(cb, {err: 1002}, null);
    return;
  }

  table.lordValue = lordValue;
  var msgBack = {};

  if (lordValue == 3) {
    table.lordUserId = player.userId;
    msgBack = {
      lordValue: lordValue,
      lordUserId: player.userId,
      nextUserId: player.userId,
      lordPokeCards: cardUtil.pokeCardsToString(table.lordPokeCards)
    };
  } else {
    var index = table.players.indexOf(player);
    var nextIndex = (index+1) % table.players.length;
    var nextPlayer = table.players[nextIndex];
    table.nextUserId = nextPlayer.userId;
    msgBack = {
      lordValue: lordValue,
      // lordUserId: null,
      lastUserId: player.userId,
      nextUserId: nextPlayer.userId
    }
  }

  messageService.pushTableMessage(table, "onGrabLord", msgBack, null);

};

exp.playCard = function(table, player, card) {
  var index = table.players.indexOf(player);
  var nextIndex = (index+1) % table.players.length;
  var nextPlayer = table.players[nextIndex];
  var msgBack = {
    player_id: player.userId,
    card: card,
    nextUserId: nextPlayer.userId
  };

  messageService.pushTableMessage(table, "onPlayCard", msgBack, null);
};