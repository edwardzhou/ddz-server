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
//var roomService = require('./roomService');

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
//    pokeGame.actionTimeoutUserId = null;
//    pokeGame.timeoutFunc = null;
    pokeGame.lastTimeout = null;
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

  var timeoutFunc = function(){
    clearNextPlayerTimeout(table);
    callback(table, nextPlayer, seqNo);
  };

//  pokeGame.actionTimeoutUserId = nextPlayer.userId;
//  pokeGame.timeoutFunc = timeoutFunc;
  pokeGame.lastTimeout = {
    timeoutCallback: callback,
    actionTimeoutUserId: nextPlayer.userId,
    timestamp: Date.now(),
    tm: tm
  };
  pokeGame.actionTimeout = setTimeout(timeoutFunc, tm * 1000);

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


//exp.playerJoin = function(table, player, next) {
//
//};
//

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

//
//exp.playerReadyTimeout = function(table, player, next) {
//
//};

/**
 * 计算玩家超时时间
 * @param player
 * @param table
 * @param actionType - 超时动作
 * @returns {*}
 */
exp.getPlayerTiming = function(player, table, actionType) {
  if (player.robot) {
    // 机器人 60% 在 1 ~ 4 秒 中随机
    //        40% 在 2 ~ 7 秒 中随机
    var r1 = Math.floor(Math.random() * 1000) % 10;
    if (r1 <= 6) {
      return Math.floor(Math.random() * 1000) % 3 + 1;
//    } else if (r1 <= 6) {
//      return Math.floor(Math.random() * 1000) % 3 + 3;
//    } else if (r1 <= 8) {
//      return Math.floor(Math.random() * 1000) % 5 + 5;
    } else{
      return Math.floor(Math.random() * 1000) % 5 + 2;
    }
    //return Math.floor(Math.random() * 10000) % 7 + 3;
  }

  // 如果是托管玩家，默认5秒超时
  if (!!player.delegating) {
    return 5;
  }

  if (actionType == 'grabLord') {
    return table.pokeGame.grabbingLordTimeout || 20;
  }

  return table.pokeGame.playCardTimeout || 30;
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
        timing: newPokeGame.grabbingLordTimeout || 20
      };
      //newPokeGame.playerMsgs[player.userId] = [];
      newPokeGame.playerMsgs[player.userId].push([eventName, eventData]);

      self.messageService.pushMessage(eventName,
        eventData,
        [player.getUidSid()],
        null);
    }

    var tokenPlayer = newPokeGame.getTokenPlayer();
    var nextTimeout = self.getPlayerTiming(tokenPlayer, table, 'grabLord');

    if (!tokenPlayer.robot && !tokenPlayer.delegating) {
      // 在线玩家加多5秒，用于网络延迟
      nextTimeout += 5;
    } else if (tokenPlayer.robot) {
      // 如果是机器人，则超时加多3秒，避免前端抢地主按钮错误隐藏
      nextTimeout += 3;
    }

    setupNextPlayerTimeout(table,
      function(timeoutTable, timeoutPlayer, timeoutSeq){
        self.grabLord(timeoutTable, timeoutPlayer, 1, timeoutSeq, null);
      },
      nextTimeout);
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
    // 默认叫地主超时时间
    var timing = pokeGame.grabbingLordTimeout || 20;
    if (!!pokeGame.lordPlayerId) {
      // 已经产生地主，则超时时间为出牌的超时时间
      timing = pokeGame.playCardTimeout;
    }

    //如果pokeGame被清空了，说明流局
    var gameAbandoned = actionResult.abandoned == true;
    if (gameAbandoned) {
      // eventName = GameEvent.gameAbandonded;
      actionResult.nextUserId = 0;
    }
    actionResult.seqNo = pokeGame.token.currentSeqNo;
    actionResult.msgNo = msgNo;
    actionResult.timing = timing;

    // 如果还没有地主产生，则推送叫地主结果，客户端以继续叫地主环节
    if (actionResult.lordUserId == 0) {
      pokeGame.playerMsgs[pokeGame.players[0].userId].push([eventName, actionResult]);
      pokeGame.playerMsgs[pokeGame.players[1].userId].push([eventName, actionResult]);
      pokeGame.playerMsgs[pokeGame.players[2].userId].push([eventName, actionResult]);

      // 推送叫地主结果
      self.messageService.pushTableMessage(table,
        eventName,
        actionResult,
        null);
    } else {
      // 地主已产生, 循环通知抢地主结果
      // 并在真实令牌玩家消息中，加入提示牌
      for (var playerIndex=0; playerIndex<pokeGame.players.length; playerIndex++) {
        var p = pokeGame.players[playerIndex];
        var tipPokeChars = '';
        if (p.userId == actionResult.lordUserId && !p.robot) {
          // 玩家是地主，且是真实玩家
          var cardInfo = CardInfo.create(p.pokeCards);
          CardAnalyzer.analyze(cardInfo);
          var tipCard = AIEngine.findLordFirstCard(cardInfo);
          tipPokeChars = tipCard.getPokeChars();
        }
        actionResult.tipPokeChars = tipPokeChars;

        var msgBack = utils.clone(actionResult);
        pokeGame.playerMsgs[pokeGame.players[0].userId].push([eventName, msgBack]);
        if (!p.robot && !p.connectionLost) {
          self.messageService.pushMessage(eventName, msgBack, [p.getUidSid()], null );
        }
      }
    }

    // 如果地主分数发生变化，则通知所有玩家倍数变化
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

    var tmpAction =(!pokeGame.lordPlayerId || pokeGame.lordValue < 1)? 'grabLord' : 'playCard';
    var tokenPlayer = pokeGame.getTokenPlayer();
    var nextTimeout = self.getPlayerTiming(tokenPlayer, table, tmpAction);

    // 真实非托管玩家，加多5秒
    if (!tokenPlayer.robot && !tokenPlayer.delegating) {
      nextTimeout += 5;
    }

    // 如果未产生地主，则设置抢地主定时器
    if (!pokeGame.lordPlayerId || pokeGame.lordValue < 1) {
       setupNextPlayerTimeout(table,
        function(timeoutTable, timeoutPlayer, timeoutSeq){
          var nextPlayer = pokeGame.getNextPlayer(timeoutPlayer.userId);
          var prevPlayer = pokeGame.getNextPlayer(nextPlayer.userId);
          var grabLoad = AIEngine.canGrabLoad(timeoutPlayer, nextPlayer, prevPlayer);
          self.grabLord(timeoutTable, timeoutPlayer, grabLoad, timeoutSeq, null);
        },
        nextTimeout);
    } else {
      // 已产生地主，设置打牌定时器
      setupNextPlayerTimeout(table,
        function(timeoutTable, timeoutPlayer, timeoutSeq){
          var cardInfo = CardInfo.create(timeoutPlayer.pokeCards);
          CardAnalyzer.analyze(cardInfo);
          var card = AIEngine.findLordFirstCard(cardInfo);

          self.playCard(timeoutTable, timeoutPlayer, card.getPokeChars() , timeoutSeq, true, null);
        },
        nextTimeout);
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

  logger.debug("table: %j, player: %j, pokeChars: %j, seqNo: %j, isTimeout: %j",
    table.tableId, player.userId, pokeChars, seqNo, isTimeout);

  if (!!isTimeout) {
    // 如果是超时导致的自动出牌，则玩家自动转为为托管
    player.delegating = true;
  } else if(!player.isRobot()) {
    // 玩家主动打牌，自动取消托管状态
    player.delegating = false;
  }

  var self = this;
  var params = {table: table, player: player, seqNo: seqNo};
  var actionResult = null;
  // 获取打牌的动作拦截器
  var actionFilter = this.getActionFilters(GameAction.PLAY_CARD);
  // 生成打牌动作代理方法
  var action = function(params, callback) {
    // 调用实际打牌处理
    self.playCardAction.doPlayCard(table, player, pokeChars, function(err, result){
      actionResult = result;
      params.pokeChars = result.pokeChars;
      params.pokeCards = result.pokeCards;
      callback(err, params);
    });
  };

  // 执行打牌动作
  runAction(action, params, actionFilter.before, actionFilter.after, function(err, result) {
    if (!!err) {
      // 出错
      utils.invokeCallback(next, null, {result: err});
      return;
    }

    // 清除牌局定时器
    clearNextPlayerTimeout(table);
    // 通知打牌动作成功
    utils.invokeCallback(next, null, {result: new Result(ErrorCode.SUCCESS)});

    // 生成玩家出牌通知信息
    var pokeGame = table.pokeGame;
    var eventName = GameEvent.playCard;
    var msgNo = pokeGame.msgNo++;

    var eventData = {
      player: {
        userId: player.userId,  // 出牌的玩家
        pokeCount: player.pokeCount  // 剩余牌数
      },
      pokeChars: actionResult.pokeChars, // 出的牌
      nextUserId: pokeGame.token.nextUserId, // 下一个令牌玩家
      seqNo: pokeGame.token.currentSeqNo, // 令牌号
      msgNo: msgNo, // 消息编号
      tipPokeChars: '', // 提示牌
      timing: table.pokeGame.playCardTimeout || 30, // 超时时间
      delegating: (!!player.delegating? 1 : 0), // 委托标志
      playedPokeBits: pokeGame.playedPokeBits
    };

    // 牌局是否已结束
    var isGameOver = player.pokeCards.length == 0;
    // 下一令牌玩家
    var nextPlayer = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
    // 提示牌
    var tipPokeChars = '';
    // 循环通知各个真实玩家此次出牌信息
    for (var playerIndex=0; playerIndex<pokeGame.players.length; playerIndex++) {
      var p = pokeGame.players[playerIndex];
      if (!isGameOver // 牌局未结束
            && (p.userId == nextPlayer.userId) // 是下一玩家?
            && (!nextPlayer.robot)) { // 且不是机器人和
        // 真人玩家, 添加提示牌
        var cardInfo = CardInfo.create(nextPlayer.pokeCards);
        var tipCard = null;
        CardAnalyzer.analyze(cardInfo);
        if (pokeGame.lastPlay.userId == nextPlayer.userId) {
          tipCard = AIEngine.findLordFirstCard(cardInfo);
        } else {
          tipCard = AIEngine.findLordPlayCard(cardInfo, pokeGame.lastPlay.card).card;
        }
        // 如果有可出的牌，则付给提示
        if (!!tipCard) {
          tipPokeChars = tipCard.getPokeChars();
        }
      } else {
        // 牌局结束，或不是下一个令牌玩家，或是机器人，都不需要给提示牌
        tipPokeChars = '';
      }

      var msgBack = utils.clone(eventData);
      msgBack.tipPokeChars = tipPokeChars;
      // 仅通知在线的真实玩家
      if (!p.robot && !p.connectionLost) {
        self.messageService.pushMessage(eventName, msgBack, [p.getUidSid()], null);
      }
      // 把消息压入玩家消息列表，用于后面玩家断线恢复牌局
      pokeGame.playerMsgs[p.userId].push([eventName, msgBack]);
    }

    // 如果出现加倍(如，炸弹，王炸）, 则通知所有玩家牌局加倍信息
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

    // 如果出牌的玩家的牌已经完了，则获胜，牌局结束
    if (player.pokeCards.length == 0) {
      // 获胜，在下一个处理周期执行结算处理
      process.nextTick(function() {
        self.gameOver(table, player);
      });
      return;
    }

    // 对下一令牌玩家设置定时器，超时自动出牌
    var tokenPlayer = pokeGame.getTokenPlayer();
    var nextTimeout = self.getPlayerTiming(tokenPlayer, table, 'playCard');

    // 对于真实非托管玩家，加多5秒用户兼容网络延迟
    if (!tokenPlayer.robot && !tokenPlayer.delegating) {
      nextTimeout += 5;
    }

    if (player.pokeCards.length > 0) {
      // var nextPlayer = pokeGame.getPlayerByUserId(pokeGame.token.nextUserId);
      // 设置定时器
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
          var nextPlayer = pokeGame.getNextPlayer(timeoutPlayer.userId);
          var lastPlayer = pokeGame.getPlayerByUserId(pokeGame.lastPlay.userId);
          var prevPlayer = pokeGame.getNextPlayer(nextPlayer.userId);

          firstCard = AIEngine.playCardLevel3(timeoutPlayer, nextPlayer, prevPlayer, lastPlayer, pokeGame.lastPlay.card);

          if (!!firstCard) {
            logger.info('Player [%d] : card-> %s' , timeoutPlayer.userId, firstCard.toString());
          }
          if (!!firstCard)
            timeoutPokeChars = firstCard.getPokeChars();
          // 出牌
          self.playCard(timeoutTable, timeoutPlayer, timeoutPokeChars, timeoutSeqNo, true, null);
        }
      }, nextTimeout);
    }
  });
};


/**
 * 牌局结束
 * @param table - 结束牌局的桌子
 * @param player - 赢家
 * @param cb
 */
exp.gameOver = function(table, player, cb) {

  var self = this;
  var params = {table: table, player: player, seqNo: -1};
  var actionResult = null;
  var pokeGame = table.pokeGame;
  // 获取动作拦截器
  var actionFilter = this.getActionFilters(GameAction.GAME_OVER);
  // 清除牌局定时器
  clearNextPlayerTimeout(table);
  // 生成牌局结算动作
  var action = function(params, callback) {
    // 实际结算调用
    self.gameOverAction.doGameOver(table, player, function(err, result){
      actionResult = result;
      callback(err, params);
    });
  };

  // 执行结算动作
  runAction(action, params, actionFilter.before, actionFilter.after, function(err, result) {
    if (!!err) {
      // 出错处理
      utils.invokeCallback(cb, err);
    } else {
      // 回调返回正常状态
      utils.invokeCallback(cb, {resultCode:0});

      // 如果是春天或反春天，通知前端倍数加倍
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

      // 通知结算结果
      var eventName = GameEvent.gameOver;
      self.messageService.pushTableMessage(table,
        eventName,
        actionResult,
        null );

      // 保存牌局信息，供后续分析用
      pokeGame.save();

      // 循环通知每一个真实玩家的金币变化
      for (var pIndex=0; pIndex< pokeGame.players.length; pIndex++) {
        var p = pokeGame.players[pIndex];
        if (!p.isRobot()) {
          self.messageService.pushMessage('onUserInfoUpdate', {user: p.toParams()}, [p.getUidSid()]);
          // 对于逃跑的玩家，通知其逃跑扣分信息
          if (!!pokeGame.escapeUserId && pokeGame.escapeUserId == p.userId) {
            self.messageService.pushMessage('onMessage',
              {
                msg: util.format('由于您强行中止牌局, 系统根据牌局信息扣除您 %d 个金币。', pokeGame.playersResults[p.userId] * -1)
              }, [p.getUidSid()]);
          }
          // 清楚玩家的牌局信息
          p.userSession.sset({pokeGameId: null, tableId: null});
        }
      }

      // 释放桌子
      table.release();
    }
  });

};

exp.playerConnectionLost = function(table, player, next) {
//  var pokeGame = table.pokeGame;
//  pokeGame.connectionLosts.push(player);
};

/**
 * 取消托管
 *
 * 如果玩家不是当前令牌玩家，则简单取消托管标志；
 * 如果玩家是当前令牌玩家，则需要先取消托管的定时器，然后重新计算超时时间，设置定时器。
 * @param table
 * @param player
 * @param next
 */
exp.cancelDelegating = function(table, player, next) {
  if (!!table && !!table.pokeGame) {
    var pokeGame = table.pokeGame;
    // 取消托管标记
    player.delegating = false;
    if (player.userId == pokeGame.token.nextUserId) {
      // 当前玩家是令牌玩家
      var lastTimeout = pokeGame.lastTimeout;
      // 获取正常动作的超时时间
      var timing = this.getPlayerTiming(player, table, 'playCard');
      // 减去已流失的时间
      timing -= Math.floor( (Date.now() - lastTimeout.timestamp) / 1000);
      // 加多5秒用于放宽对网络速度的依赖。
      timing += 5;
      // 重新设置定时器
      setupNextPlayerTimeout(table, lastTimeout.timeoutCallback, timing);
    }
  }

  // 回调通知
  utils.invokeCallback(next);
};