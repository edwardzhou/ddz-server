var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var utils = require('../util/utils');
var cardUtil = require('../util/cardUtil');
var GameRoom = require('../domain/gameRoom');
var Player = require('../domain/player');
var PlayerState = require('../consts/consts').PlayerState;
var GameEvent = require('../consts/consts').Event.GameEvent;
//var messageService = require('./messageService');
//var PokeCard = require('../domain/pokeCard');
var GameAction = require('../consts/consts').GameAction;
var async = require('async');

var CardService = function(app) {
  this.theApp = app;
  this.actionsConfig = {}
};

module.exports = CardService;

var exp = CardService.prototype;

exp.init = function (opts) {
  opts = opts || {};
  this.messageService = opts.messageService;
  this.theApp = opts.theApp || this.theApp;
  this.grabLordAction = opts.grabLordAction;
  this.playerJoinAction = opts.playerJoinAction;
  this.playerReadyAction = opts.playerReadyAction;
  this.playCardAction = opts.playCardAction;
};

exp.configGameActionFilters = function(gameAction, beforeFilters, afterFilters) {
  this.actionsConfig[gameAction] = {
    gameAction: gameAction,
    before: beforeFilters,
    after: afterFilters
  };
};

var runAction = function(action, params, beforeFilters, afterFilters, cb) {
  var tasks = [];
  tasks.push(function(callback){
    callback(null, params);
  });

  if (!!beforeFilters) {
    for (var index in beforeFilters) {
      tasks.push(beforeFilters[index].execute);
    }
  }

  tasks.push(action);

  if (!!afterFilters) {
    for (var index in afterFilters) {
      tasks.push(afterFilters[index].execute);
    }
  }

  async.waterfall(tasks, function(err, result) {
    if (!!err) {
      utils.invokeCallback(cb, err);
    } else {
      utils.invokeCallback(cb, null, result);
    }
  });
};

var setupNextPlayerTimeout = function (table, func, seconds) {
  var pokeGame = table.pokeGame;
  var nextPlayer = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
  var seqNo = pokeGame.token.currentSeqNo;
  var tm = seconds;
  if (!tm)
    tm = (!nextPlayer.isDelegating())? 35 : 3;

  pokeGame.actionTimeout = setTimeout(function(){
      func(table, nextPlayer, seqNo);
    }, tm * 1000);
};

exp.getActionFilters = function(gameAction) {
  var filterConfig = this.actionsConfig[gameAction];
  if (filterConfig == null) {
    logger.warning("Cannot found action filters config for %d", gameAction);
    filterConfig = {};
  }

  return filterConfig;
};

exp.doPlayerJoin = function(table, player, next) {

};


exp.onPlayerReady = function (table, player, cb) {
  logger.info("onPlayerReady");
  this.messageService.pushTableMessage(table, "onPlayerJoin", table.toParams(), null );

  if ( (table.players.length == 3) &&
    table.players[0].isReady() && table.players[1].isReady() && table.players[2].isReady()) {
    exp.startGame(table);
  }
};

/**
 * 执行玩家就绪动作
 * @param table - 玩家所在的桌子
 * @param player - 就绪的玩家
 * @param next
 */
exp.doPlayerReady = function(table, player, next) {
  // 玩家状态设为 READY
  player.state = PlayerState.READY;
  // 通知同桌玩家
  this.messageService.pushTableMessage(table, GameEvent.playerReady, table.toParams(), null);

  // 如果3个玩家都已就绪，这开始牌局
  if (table.players.length == 3 &&
    table.players[0].isReady() &&
    table.players[1].isReady() &&
    table.players[2].isReady()) {
    //process.nextTick(function() {
      this.startGame(table);
    //});
  }
}

/**
 * 开始牌局
 * @param table - 要开始牌局的桌子
 * @param next
 */
exp.startGame = function (table, next) {
  var self = this;
  this.startGameAction.execute(table, function(err) {
    var newPokeGame = table.pokeGame;
    var seqNo = newPokeGame.token.currentSeqNo;
    // 通知各玩家牌局开始
    for (var index=0; index<table.players.length; index ++) {
      var player = table.players[index];
      self.messageService.pushMessage(GameEvent.gameStart,
        {
          grabLord: (player.userId == newPokeGame.grabbingLord.nextUserId ? 1 : 0),
          pokeCards: player.pokeCardsString(),
          gameId: newPokeGame.gameId,
          seqNo: (player.userId == newPokeGame.grabbingLord.nextUserId ? seqNo : 0)
        },
        [player.getUidSid()],
        null);
    }
  });


};

/**
 * 玩家叫地主
 * @param table - 玩家所在的桌子
 * @param player - 玩家
 * @param lordValue - 地主分数 (0 - 不叫, 1 - 1分， 2 - 2分， 3 - 3分)
 * @param next
 */
exp.grabLord = function(table, player, lordValue, seqNo, next) {
//  grabLordAction.doGrabLord(table, player, lordValue, function(err, gameTable, msgBack) {
//    // 有错误
//    if (err != null) {
//      utils.invokeCallback(cb, err);
//      return;
//    }
//
//    var gameEvent = GameEvent.grabLord;
//    if (gameTable.pokeGame == null) {
//      // 流局
//      gameEvent = GameEvent.gameAbandonded;
//    }
//
//    // 回调请求结果
//    utils.invokeCallback(cb, {resultCode:0});
//
//    // 通知叫地主结果
//    process.nextTick(function() {
//      this.messageService.pushTableMessage(gameTable, gameEvent, msgBack, null);
//    });
//  });

  var params = {table: table, player: player, seqNo: seqNo};
  var actionResult = null;
  var actionFilter = this.getActionFilters(GameAction.GRAB_LORD);

  var self = this;

  var action = function(params, callback) {
    self.grabLordAction.doGrabLord(table, player, lordValue, function(err, result) {
      actionResult = result;
      callback(err, params);
    });
  };

  runAction(action, params, actionFilter.before, actionFilter.after, function(err, result) {
    if (!!err) {
      utils.invokeCallback(next, err);
    } else {
      utils.invokeCallback(next, {resultCode:0});

      var pokeGame = table.pokeGame;
      var eventName = GameEvent.grabLord;
      var gameAbandoned = (pokeGame == null);
      if (gameAbandoned) {
        eventName = GameEvent.gameAbandonded;
      }

      self.messageService.pushTableMessage(table,
        eventName,
        actionResult,
        null );

      if (!gameAbandoned) {
        var nextPlayer = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
        var seqNo = pokeGame.token.currentSeqNo;
        var tm = (!nextPlayer.isDelegating())? 35 : 3;

        pokeGame.actionTimeout = setTimeout(function(){
          exp.playCard(table, nextPlayer, '', seqNo, true, null);
        }, tm * 1000);
      }
    }
  });


};

/**
 * 出牌
 * @param table
 * @param player
 * @param pokeChars
 * @param next
 */
exp.playCard = function(table, player, pokeChars, seqNo, isTimeout, next) {

  var params = {table: table, player: player, seqNo: seqNo};
  var actionResult = null;
  var action = function(params, callback) {
    playCardAction.doPlayerCard(table, player, pokeChars, function(err, result){
      actionResult = result;
      callback(err, params);
    });
  };

  runAction(action, params, exp.beforeFilters, exp.afterFilters, function(err, result) {
    if (!!err) {
      utils.invokeCallback(next, err);
    } else {
      utils.invokeCallback(next, {resultCode:0});

      var pokeGame = table.pokeGame;
      var eventName = GameEvent.playCard;

      this.messageService.pushTableMessage(table,
        eventName,
        {
          playerId: player.userId,
          pokeChars: pokeChars,
          nextUserId: pokeGame.token.nextUserId,
          currentSeqNo: pokeGame.token.currentSeqNo
        },
        null );

      setupNextPlayerTimeout(table, function(table, player, seqNo) {
          exp.playCard(table, player, '', seqNo, true, null);
        });
    }
  });

//  playerCardAction.doPlayCard(table, player, pokeChars, function(err, gameTable, gamePlayer) {
//    if (err) {
//      utils.invokeCallback(cb, err);
//      return;
//    }
//
//    var gameEvent = GameEvent.playCard;
//    utils.invokeCallback(cb, {resultCode: 0});
//
//    this.messageService.pushTableMessage(table, gameEvent, {playerId: player.userId, pokeChars: pokeChars}, null);
//  });
};