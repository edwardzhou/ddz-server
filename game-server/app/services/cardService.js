var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var utils = require('../util/utils');
var cardUtil = require('../util/cardUtil');
var GameRoom = require('../domain/gameRoom');
var GameTable = require('../domain/gameTable');
var Player = require('../domain/player');
var PlayerState = require('../consts/consts').PlayerState;
var GameEvent = require('../consts/consts').Event.GameEvent;
var messageService = require('./messageService');
var PokeCard = require('../domain/pokeCard');

var exp = module.exports;

var theApp = null;

exp.init = function (app) {
  theApp = app;
};

/**
 * 排序比较函数
 * @param p1
 * @param p2
 * @returns {number}
 * @private
 */
var _sortPokeCard = function(p1, p2) {
  return p1.pokeIndex - p2.pokeIndex;
};

exp.onPlayerReady = function (table, player, cb) {
  logger.info("onPlayerReady");
  messageService.pushTableMessage(table, "onPlayerJoin", table.toParams(), null );

  if ( (table.players.length == 3) &&
    table.players[0].isReady() && table.players[1].isReady() && table.players[2].isReady()) {
    exp.startGame(table);
  }
};

/**
 * 执行玩家就绪动作
 * @param table - 玩家所在的桌子
 * @param player - 就绪的玩家
 * @param cb
 */
exp.doPlayerReady = function(table, player, cb) {
  // 玩家状态设为 READY
  player.state = PlayerState.READY;
  // 通知同桌玩家
  messageService.pushTableMessage(table, GameEvent.playerReady, table.toParams(), null);

  // 如果3个玩家都已就绪，这开始牌局
  if (table.players.length == 3 &&
    table.players[0].isReady() &&
    table.players[1].isReady() &&
    table.players[2].isReady()) {
    process.nextTick(function() {
      exp.startGame(table);
    });
  }
}

/**
 * 开始牌局
 * @param table - 要开始牌局的桌子
 * @param cb
 */
exp.startGame = function (table, cb) {
  // 洗牌
  var pokeCards = PokeCard.shuffle();
  var pokeCards1 = [];
  var pokeCards2 = [];
  var pokeCards3 = [];

  // 派牌, 保留最后3张为地主牌
  while(pokeCards.length>3) {
    pokeCards1.push(pokeCards.shift());
    pokeCards2.push(pokeCards.shift());
    pokeCards3.push(pokeCards.shift());
  }

  // 把牌排序后分给各玩家
  table.players[0].setPokeCards(pokeCards1.sort(_sortPokeCard));
  table.players[1].setPokeCards(pokeCards2.sort(_sortPokeCard));
  table.players[2].setPokeCards(pokeCards3.sort(_sortPokeCard));

  // 保存地主牌
  table.lordPokeCards = pokeCards.sort(_sortPokeCard);

  // 创建新牌局
  var newPokeGame = PokeGame.newGame(table.room.getRoomId(), table.tableId, table.players);
  newPokeGame.lordPokeCards = cardUtil.pokeCardsToString(table.lordPokeCards);

  table.game = newPokeGame;

  // 随机指定第一个叫地主的用户
  var lordUserIndex = (new Date()).getTime() % 3;
  var lordUserId = table.players[lordUserIndex].userId;
  table.nextUserId = lordUserId;
  table.lastUserId = null;
  table.firstLordUserIndex = lordUserIndex;

  // 通知各玩家牌局开始
  for (var index=0; index<table.players.length; index ++) {
    var player = table.players[index];
    messageService.pushMessage(GameEvent.gameStart,
      {
        player: player.toParams(),
        grabLord: (player.userId == lordUserId ? 1 : 0),
        pokeCards: player.pokeCardsString()
      },
      [player.getUidSid()],
      null);
  }
};

/**
 * 玩家叫地主
 * @param table - 玩家所在的桌子
 * @param player - 玩家
 * @param lordValue - 地主分数 (0 - 不叫, 1 - 1分， 2 - 2分， 3 - 3分)
 * @param cb
 */
exp.grabLord = function(table, player, lordValue, cb) {
  // 必须是轮到叫地主的玩家(table.nextUserId == player.userId)才能叫
  if (table.nextUserId != player.userId) {
    // 不是轮到当前玩家叫地主，返回错误
    utils.invokeCallback(cb, {err: 1001}, null);
    return;
  }

  // 所叫的分数必须大于当前地主分
  if (lordValue > 0 && lordValue <= table.lordValue) {
    utils.invokeCallback(cb, {err: 1002}, null);
    return;
  }

  if (lordValue > 0) {
    // 更新有效地主分
    table.lordValue = lordValue;
  }
  var msgBack = {};

  // 如果叫3分，则该玩家为地主，并结束抢地主环节。
  if (lordValue == 3) {
    // 指定玩家为地主, 并把地主牌通知个所有人
    table.lordUserId = player.userId;
    var pokeCards = player.pokeCards.concat(table.lordPokeCards).sort(_sortPokeCard);
    player.setPokeCards(pokeCards);

    msgBack = {
      lordValue: lordValue,
      lordUserId: player.userId,
      nextUserId: player.userId,
      lordPokeCards: cardUtil.pokeCardsToString(table.lordPokeCards)
    };
  } else {
    // 未产生地主，通知
    var index = table.players.indexOf(player);
    var nextIndex = (index+1) % table.players.length;
    var nextPlayer = table.players[nextIndex];

    if (table.game.firstLordUserIndex != nextIndex) {
      table.nextUserId = nextPlayer.userId;
      msgBack = {
        lordValue: lordValue,
        // lordUserId: null,
        lastUserId: player.userId,
        nextUserId: nextPlayer.userId
      }
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