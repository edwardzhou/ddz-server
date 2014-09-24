var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var utils = require('../util/utils');
var cardUtil = require('../util/cardUtil');
var GameRoom = require('../domain/gameRoom');
var Player = require('../domain/player');
var PlayerState = require('../consts/consts').PlayerState;
var GameEvent = require('../consts/consts').Event.GameEvent;
var GameAction = require('../consts/consts').GameAction;
var async = require('async');
var ErrorCode = require('../consts/errorCode');
var Result = require('../domain/result');
var CardInfo = require('../AI/CardInfo');
var CardAnalyzer = require('../AI/CardAnalyzer');
var AIEngine = require('../AI/AIEngine');

// 游戏动作值与属性名对照表，用于简化 @configGameAction 的逻辑
var GameActionNames = {};
GameActionNames[ GameAction.GRAB_LORD ] = 'grabLordAction';
GameActionNames[ GameAction.GAME_START ] = 'startGameAction';
GameActionNames[ GameAction.PLAY_CARD ] = 'playCardAction';
GameActionNames[ GameAction.GAME_OVER] = 'gameOverAction';


/**
 * 牌逻辑服务
 * @param app
 * @constructor
 */
var CardService = function(app) {
  this.theApp = app;
  this.actionsConfig = {}
};

module.exports = CardService;

var exp = CardService.prototype;

/**
 * 运行action
 * 通过async.waterfall流程，顺序执行beforeFilters里的各个filter -> action -> afterFilters里各个filter
 * 如果中间任意一个环境出错了，流程终止执行，并回调cb通知出错cb(err, ...)；
 * 如果全部完成，回调cb通知结果cb(null, ...)
 * @param action 动作类
 * @param params 要传递个beforeFilters afterFilters的参数
 * @param beforeFilters filter数组
 * @param afterFilters filter数组
 * @param cb 回调，第一个参数表示成功或失败, 成功传null, 失败回传错误信息err
 */
var runAction = function(action, params, beforeFilters, afterFilters, cb) {
  // 用于async.waterfall的任务数组
  var tasks = [];
  // 压入启动函数, 作用是将params传进filters
  tasks.push(function(callback){
    callback(null, params);
  });

  // 压入beforeFilters
  if (!!beforeFilters) {
    for (var index=0; index<beforeFilters.length; index++) {
      tasks.push(beforeFilters[index].execute);
    }
  }

  // 压入action
  tasks.push(action);

  // 压入afterFilters
  if (!!afterFilters) {
    for (var index=0; index<afterFilters.length; index++) {
      tasks.push(afterFilters[index].execute);
    }
  }

  // waterfall异步执行tasks
  async.waterfall(tasks, function(err, result) {
    if (!!err) {
      utils.invokeCallback(cb, err, result);
    } else {
      utils.invokeCallback(cb, null, result);
    }
  });
};

/**
 * 设置玩家准备超时处理
 * @param table 玩家所在的table
 * @param player
 * @param callback 超时后要执行的动作
 * @param seconds 超时时间，单位秒, 如果不传，默认30s
 */
var setupPlayerReadyTimeout = function(table, player, callback, seconds) {
  var tm = seconds;
  if (!tm)
    tm = 30;

  table.playerTimeouts = table.playerTimeouts || [];
  table.playerTimeouts[player.userId] = setTimeout(function() {
    callback(table, player);
  }, tm * 1000);
};

var clearNextPlayerTimeout = function (table) {
  var pokeGame = table.pokeGame;
  if (!!pokeGame && !!pokeGame.actionTimeout) {
    clearTimeout(pokeGame.actionTimeout);
    pokeGame.actionTimeout = null;
  }
};

/**
 * 设置下一玩家的超时处理
 * @param table 需要超时处理的table
 * @param callback 超时后的动作
 * @param seconds 超时时间，单位秒, 如果不传，默认30s (托管时3s)
 */
var setupNextPlayerTimeout = function (table, callback, seconds) {
  clearNextPlayerTimeout(table);

  var pokeGame = table.pokeGame;
  var nextPlayer = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
  var seqNo = pokeGame.token.currentSeqNo;
  var tm = seconds;
  if (typeof tm == 'undefined')
    tm = (!nextPlayer.isDelegating())? 35 : 35;

  pokeGame.actionTimeout = setTimeout(function(){
      clearNextPlayerTimeout(table);
      callback(table, nextPlayer, seqNo);
    }, tm * 1000);
};

/**
 * 配置动作
 * @param gameAction 动作值
 * @param action 动作具体逻辑，参见 ./actions/xxx.js
 * @param beforeFilters 前置过滤器，在执行动作之前被调用，主要用于各种条件检查和游戏事件触发
 * @param afterFilters 后置过滤器，在动作成功执行后被调用，主要用于参数修改和游戏事件触发
 */
exp.configGameAction = function(gameAction, action, beforeFilters, afterFilters) {
  this.actionsConfig[gameAction] = {
    gameAction: gameAction,
    before: beforeFilters,
    after: afterFilters
  };
  this[ GameActionNames[gameAction] ] = action;
};

/**
 * 取gameAction的配置 (beforeFilters, afterFilters)
 * @param gameAction
 * @returns {*}
 */
exp.getActionFilters = function(gameAction) {
  var filterConfig = this.actionsConfig[gameAction];
  if (filterConfig == null) {
    logger.warn("Cannot found action filters config for %d", gameAction);
    filterConfig = {};
  }

  return filterConfig;
};


exp.playerJoin = function(table, player, next) {

};


/**
 * 执行玩家就绪动作
 * @param table - 玩家所在的桌子
 * @param player - 就绪的玩家
 * @param next
 */
exp.playerReady = function(table, player, next) {
  var self = this;
  // 玩家状态设为 READY
  player.state = PlayerState.READY;

  process.nextTick(function() {
    // 通知同桌玩家
    self.messageService.pushTableMessage(table, GameEvent.playerReady, table.toParams(), null);

    // 如果3个玩家都已就绪，这开始牌局
    if (table.players.length == 3 &&
      table.players[0].isReady() &&
      table.players[1].isReady() &&
      table.players[2].isReady()) {
      logger.info("table[%d] all players are ready, start new game.", table.tableId);
      process.nextTick(function() {
        self.startGame(table);
      });
    }
  });

  utils.invokeCallback(next, null, {result: 0});
};


exp.playerReadyTimeout = function(table, player, next) {

};

exp.getPlayerTiming = function(player, actionType) {
  if (player.robot) {
    return Math.floor(Math.random() * 10000) % 7 + 3;
  }

  if (!!player.delegating) {
    return 5;
  }

  return 30;
};

/**
 * 开始牌局
 * @param table - 要开始牌局的桌子
 * @param next
 */
exp.startGame = function (table, next) {
  logger.info("start a new game for table: ", table.tableId);
  var self = this;
  this.startGameAction.execute(table, function(err) {
    var newPokeGame = table.pokeGame;
    var seqNo = newPokeGame.token.currentSeqNo;
    var msgNo = newPokeGame.msgNo++;
    // 通知各玩家牌局开始
    for (var index=0; index<table.players.length; index ++) {
      var player = table.players[index];
      player.state = PlayerState.NEW_GAME;
      var eventName = GameEvent.gameStart;
      var eventData = {
        grabLord: (player.userId == newPokeGame.grabbingLord.nextUserId ? 1 : 0),
        pokeCards: player.pokeCardsString(),
        pokeGame: newPokeGame.toParams(),
        player: player.toParams(),
        nextUserId: newPokeGame.grabbingLord.nextUserId,
        seqNo: (player.userId == newPokeGame.grabbingLord.nextUserId ? seqNo : 0),
        msgNo: msgNo,
        timing: 10
      };
      //newPokeGame.playerMsgs[player.userId] = [];
      newPokeGame.playerMsgs[player.userId].push([eventName, eventData]);

      self.messageService.pushMessage(eventName,
        eventData,
        [player.getUidSid()],
        null);
    }

//    var grabbingLordPlayer = newPokeGame.getPlayerByUserId(newPokeGame.grabbingLord.nextUserId);
//    newPokeGame.actionTimeout
    //var nextPlayer = newPokeGame.getTokenPlayer();

    setupNextPlayerTimeout(table,
      function(timeoutTable, timeoutPlayer, timeoutSeq){
        self.grabLord(timeoutTable, timeoutPlayer, 1, timeoutSeq, null);
      },
      self.getPlayerTiming(newPokeGame.getTokenPlayer()));
  });


};

/**
 * 玩家叫地主
 * @param table - 玩家所在的桌子
 * @param player - 玩家
 * @param lordAction - 地主分数 (0 - 不叫, 1 - 叫地主/抢地主)
 * @param next
 */
exp.grabLord = function(table, player, lordAction, seqNo, next) {
  var params = {table: table, player: player, seqNo: seqNo};
  var actionResult = null;
  var actionFilter = this.getActionFilters(GameAction.GRAB_LORD);
  var self = this;

  // table.pokeGame为空，可能此次调用是超时回调
  if (!table.pokeGame) {
    utils.invokeCallback(next, null, {resultCode:0});
    return;
  }

  var lordValue = table.pokeGame.grabbingLord.lordValue || 0;

  var action = function(params, callback) {
    self.grabLordAction.doGrabLord(table, player, lordAction, function(err, result) {
      actionResult = result;
      // 当地主产生时，保留叫地主过程里指定的下一玩家id , ref to ./filters/increaseSeqNo.js
//      if (!!table.pokeGame && !!table.pokeGame.lordPlayerId) {
      if (!!table.pokeGame) {
        table.pokeGame.token.nextUserId = result.nextUserId;
        params.keepNextUserId = true;
      }
      callback(err, params);
    });
  };

  runAction(action, params, actionFilter.before, actionFilter.after, function(err, result) {
    if (!!err) {
      utils.invokeCallback(next, null, err);
      return;
    }
    utils.invokeCallback(next, null, {resultCode:0});

    var pokeGame = table.pokeGame;
    var eventName = GameEvent.grabLord;
    var msgNo = pokeGame.msgNo++;

    //如果pokeGame被清空了，说明流局
    var gameAbandoned = actionResult.abandoned == true;
    if (gameAbandoned) {
      // eventName = GameEvent.gameAbandonded;
      actionResult.nextUserId = 0;
    }
    actionResult.seqNo = pokeGame.token.currentSeqNo;
    actionResult.msgNo = msgNo;
    actionResult.timing = (!!pokeGame.lordPlayerId) ? 30 : 10;

    pokeGame.playerMsgs[pokeGame.players[0].userId].push([eventName, actionResult]);
    pokeGame.playerMsgs[pokeGame.players[1].userId].push([eventName, actionResult]);
    pokeGame.playerMsgs[pokeGame.players[2].userId].push([eventName, actionResult]);

    // 推送叫地主结果
    self.messageService.pushTableMessage(table,
      eventName,
      actionResult,
      null );

    if (pokeGame.grabbingLord.lordValue > lordValue) {
      eventName = GameEvent.lordValueUpgrade;
      msgNo = pokeGame.msgNo++;
      var eventData = {
        lordValue: pokeGame.grabbingLord.lordValue,
        msgNo: msgNo
      };
      self.messageService.pushTableMessage(
        table,
        eventName,
        eventData,
        null
      );
      pokeGame.playerMsgs[pokeGame.players[0].userId].push([eventName, eventData]);
      pokeGame.playerMsgs[pokeGame.players[1].userId].push([eventName, eventData]);
      pokeGame.playerMsgs[pokeGame.players[2].userId].push([eventName, eventData]);
    }


    logger.info('[cardService.grabLord] game abandoned => ', gameAbandoned);
    // 流局则退出
    if (gameAbandoned) {
      // params.keepNextUserId = true;
      logger.info('[cardService.grabLord] about to start new game');
      process.nextTick(function() {
        self.startGame(table);
      });
      return;
    }

    if (!pokeGame.lordPlayerId || pokeGame.lordValue < 1) {
      setupNextPlayerTimeout(table,
        function(timeoutTable, timeoutPlayer, timeoutSeq){
          self.grabLord(timeoutTable, timeoutPlayer, 1, timeoutSeq, null);
        },
        self.getPlayerTiming(pokeGame.getTokenPlayer()));
    } else {
      setupNextPlayerTimeout(table,
        function(timeoutTable, timeoutPlayer, timeoutSeq){
          var cardInfo = CardInfo.create(timeoutPlayer.pokeCards);
          CardAnalyzer.analyze(cardInfo);
          var card = AIEngine.findLordFirstCard(cardInfo, cardInfo, cardInfo);

          self.playCard(timeoutTable, timeoutPlayer, card.getPokeChars() , timeoutSeq, true, null);
        },
        self.getPlayerTiming(pokeGame.getTokenPlayer()));
    }


//    // 未产生地主？
//    if (pokeGame.lordPlayerId == null) {
//      // 设置下一玩家叫地主超时时，自动不叫
//      setupNextPlayerTimeout(table, function(table, player, seqNo){
//        self.grabLord(table, player, 0, seqNo, null);
//      });
//    } else {
//      // 地主超时自动出一张牌
//      // TODO: 下一步要改用AI在处理
//      setupNextPlayerTimeout(table, function(table, player, seqNo){
//        var pokeChar = player.pokeCards[0].pokeChar;
//        self.playCard(table, player, pokeChar, seqNo, true, null);
//      }, 3)
//    }
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

  logger.debug("table: %j, player: %j, pokeChars: %j, seqNo: %j, isTimeout: %j",
    table.tableId, player.userId, pokeChars, seqNo, isTimeout);

  if (!!isTimeout) {
    player.delegating = true;
  }

  var self = this;
  var params = {table: table, player: player, seqNo: seqNo};
  var actionResult = null;
  var actionFilter = this.getActionFilters(GameAction.PLAY_CARD);
  var action = function(params, callback) {
    self.playCardAction.doPlayCard(table, player, pokeChars, function(err, result){
      actionResult = result;
      params.pokeChars = result.pokeChars;
      params.pokeCards = result.pokeCards;
      callback(err, params);
    });
  };

  runAction(action, params, actionFilter.before, actionFilter.after, function(err, result) {
    if (!!err) {
      utils.invokeCallback(next, null, {result: err});
      return;
    }

    clearNextPlayerTimeout(table);

    utils.invokeCallback(next, null, {result: new Result(ErrorCode.SUCCESS)});

    var pokeGame = table.pokeGame;
    var eventName = GameEvent.playCard;
    var msgNo = pokeGame.msgNo++;

    var eventData = {
      player: {
        userId: player.userId,
        pokeCount: player.pokeCount
      },
      pokeChars: actionResult.pokeChars,
      nextUserId: pokeGame.token.nextUserId,
      seqNo: pokeGame.token.currentSeqNo,
      msgNo: msgNo,
      timing: 30,
      delegating: (!!player.delegating? 1 : 0)
    };

    self.messageService.pushTableMessage(table,
      eventName,
      eventData,
      null );

    pokeGame.playerMsgs[pokeGame.players[0].userId].push([eventName, eventData]);
    pokeGame.playerMsgs[pokeGame.players[1].userId].push([eventName, eventData]);
    pokeGame.playerMsgs[pokeGame.players[2].userId].push([eventName, eventData]);

    if (!!actionResult.lordValueUpgrade) {
      eventName = GameEvent.lordValueUpgrade;
      msgNo = pokeGame.msgNo++;
      eventData = {
        lordValue: pokeGame.lordValue,
        msgNo: msgNo
      };
      self.messageService.pushTableMessage(
        table,
        eventName,
        eventData,
        null
       );

      pokeGame.playerMsgs[pokeGame.players[0].userId].push([eventName, eventData]);
      pokeGame.playerMsgs[pokeGame.players[1].userId].push([eventName, eventData]);
      pokeGame.playerMsgs[pokeGame.players[2].userId].push([eventName, eventData]);
    }

    if (player.pokeCards.length == 0) {
      // won
      process.nextTick(function() {
        self.gameOver(table, player);
      });
      return;
    }

    if (player.pokeCards.length > 0) {
      var nextPlayer = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
      var nextTimeout = 10;
      if (!!nextPlayer.delegating || nextPlayer.robot) {
        nextTimeout = 2;
      }
      setupNextPlayerTimeout(table, function(timeoutTable, timeoutPlayer, timeoutSeqNo){
        var timeoutPokeChars = ''; // 不出
        var pokeGame = timeoutTable.pokeGame;
        var cardInfo;
        var firstCard;
        if (!!pokeGame) {
          logger.info('timeoutPlayer[%d], pokeChars: %s, pokes: ',
            timeoutPlayer.userId,
            cardUtil.pokeCardsToPokeChars(timeoutPlayer.pokeCards),
            cardUtil.pokeCardsToValueString(timeoutPlayer.pokeCards)
          );
          if (pokeGame.lastPlay.userId == timeoutPlayer.userId) {
            //pokeChars = timeoutPlayer.pokeCards[0].pokeChar;
            cardInfo = CardInfo.create(timeoutPlayer.pokeCards);
            CardAnalyzer.analyze(cardInfo);
            firstCard = AIEngine.findLordFirstCard(cardInfo, cardInfo, cardInfo);
            timeoutPokeChars = firstCard.getPokeChars();
          } else {
            cardInfo = CardInfo.create(timeoutPlayer.pokeCards);
            CardAnalyzer.analyze(cardInfo);
            firstCard = AIEngine.findLordPlayCard(cardInfo, cardInfo, cardInfo, pokeGame.lastPlay.card);
            if (!!firstCard)
              timeoutPokeChars = firstCard.getPokeChars();
          }

          if (!!firstCard) {
            logger.info('Player [%d] : card-> %s' , timeoutPlayer.userId, firstCard.toString());
          }
          self.playCard(timeoutTable, timeoutPlayer, timeoutPokeChars, timeoutSeqNo, true, null);
        }
      }, self.getPlayerTiming(pokeGame.getTokenPlayer()));
    }
//    setupNextPlayerTimeout(table, function(table, player, seqNo) {
//        self.playCard(table, player, '', seqNo, true, null);
//      });
  });
};

exp.gameOver = function(table, player, cb) {

  var self = this;
  var params = {table: table, player: player, seqNo: -1};
  var actionResult = null;
  var pokeGame = table.pokeGame;
  var actionFilter = this.getActionFilters(GameAction.GAME_OVER);
  clearNextPlayerTimeout(table);
  var action = function(params, callback) {
    self.gameOverAction.doGameOver(table, player, function(err, result){
      actionResult = result;
      callback(err, params);
    });
  };

  runAction(action, params, actionFilter.before, actionFilter.after, function(err, result) {
    if (!!err) {
      utils.invokeCallback(cb, err);
    } else {
      utils.invokeCallback(cb, {resultCode:0});

      if (actionResult.spring != 0) {
        self.messageService.pushTableMessage(
          table,
          GameEvent.lordValueUpgrade,
          {
            lordValue: pokeGame.lordValue,
            msgNo: pokeGame.msgNo++
          },
          null
        );
      }

      actionResult.timing = 15;

      //var pokeGame = table.pokeGame;
      var eventName = GameEvent.gameOver;

      self.messageService.pushTableMessage(table,
        eventName,
        actionResult,
        null );

      pokeGame.save();

      for (var pIndex=0; pIndex< pokeGame.players.length; pIndex++) {
        var p = pokeGame.players[pIndex];
        if (!p.isRobot()) {
          p.userSession.sset({pokeGameId: null, tableId: null});
        }
      }

      table.release();

//      process.nextTick(function() {
//        table.pokeGame = null;
//        table.release();
//      });

//      setupPlayerReadyTimeout(table, table.players[0], self.playerReadyTimeout.bind(self), 35);
//      setupPlayerReadyTimeout(table, table.players[1], self.playerReadyTimeout.bind(self), 35);
//      setupPlayerReadyTimeout(table, table.players[2], self.playerReadyTimeout.bind(self), 35);
    }
  });

};

exp.playerConnectionLost = function(table, player, next) {
//  var pokeGame = table.pokeGame;
//  pokeGame.connectionLosts.push(player);
};