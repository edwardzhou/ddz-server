/**
 * Created by edwardzhou on 13-11-27.
 */

var utils = require('../../util/utils');
var GameState = require('../../consts/consts').GameState;
var ErrorCode = require('../../consts/errorCode');
var CardUtil = require('../../util/cardUtil');
var GrabLordType = require('../../consts/consts').GrabLordType;
var PlayerState = require('../../consts/consts').PlayerState;
var PlayerRole = require('../../consts/consts').PlayerRole;

var GrabLordAction = function() {

};

module.exports = GrabLordAction;

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



/**
 * 处理叫地主逻辑
 * @param gameTable
 * @param player
 * @param lordAction
 * @param cb
 */
GrabLordAction.doGrabLord = function(gameTable, player, lordAction, cb) {
  var table = gameTable;
  var pokeGame = table.pokeGame;
//  // 必须是轮到叫地主的玩家(table.nextUserId == player.userId)才能叫
//  if (pokeGame.token.nextUserId != player.userId) {
//    // 不是轮到当前玩家叫地主，返回错误
//    utils.invokeCallback(cb, {err: ErrorCode.NOT_IN_TURN}, null);
//    return;
//  }

  // 所叫的分数必须大于当前地主分
//  if (lordAction > 0 && lordAction <= pokeGame.grabbingLord.lordValue) {
//    utils.invokeCallback(cb, {err: ErrorCode.INVALID_GRAB_LORD_VALUE}, null);
//    return;
//  }

  pokeGame.grabbingLord.grabTimes ++;

  var grabState = PlayerState.NO_GRAB_LORD;

  if (pokeGame.grabbingLord.lordValue == 0) {
    if (lordAction == GrabLordType.NONE) {
      player.state = PlayerState.NO_GRAB_LORD;
    } else {
      player.state = PlayerState.GRAB_LORD;
      pokeGame.grabbingLord.lordValue = 1;
      pokeGame.grabbingLord.firstLordPlayer = player;
      pokeGame.grabbingLord.lordPlayer = player;
    }
  } else {
    if (lordAction == GrabLordType.NONE) {
      player.state = PlayerState.PASS_GRAB_LORD;
    } else {
      player.state = PlayerState.RE_GRAB_LORD;
      pokeGame.grabbingLord.lordValue *= 2;
      pokeGame.grabbingLord.lordPlayer = player;
    }
  }

  var grabState = player.state;

  var nextPlayer = null;
  var prevPlayer = null;
  nextPlayer = pokeGame.getNextPlayer(player.userId);

  var isGrabLordFinish = false;
  if (pokeGame.grabbingLord.lordValue == 1) {
    isGrabLordFinish = pokeGame.grabbingLord.firstPlayer == nextPlayer;
  } else if (pokeGame.grabbingLord.lordValue > 1) {
    isGrabLordFinish = pokeGame.grabbingLord.firstLordPlayer == player;
  }

  var isGiveUp = (pokeGame.grabbingLord.firstPlayer == nextPlayer) && (pokeGame.grabbingLord.lordValue == 0);

  if (isGrabLordFinish) {
    pokeGame.lordValue = pokeGame.grabbingLord.lordValue;
    var lordPlayer = pokeGame.grabbingLord.lordPlayer;
    pokeGame.token.nextUserId = lordPlayer.userId;
    gameTable.nextUserId = lordPlayer.userId;
    lordPlayer.pokeCards.push(pokeGame.lordCards[0], pokeGame.lordCards[1], pokeGame.lordCards[2]);
    lordPlayer.pokeCards.sort(function(p1, p2) {
      return p1.pokeIndex - p2.pokeIndex;
    });
    lordPlayer.role = PlayerRole.LORD;
    nextPlayer = pokeGame.getNextPlayer(lordPlayer.userId);
    prevPlayer = pokeGame.getPrevPlayer(lordPlayer.userId);
    nextPlayer.role = PlayerRole.FARMER;
    prevPlayer.role = PlayerRole.FARMER;
    pokeGame.lordPlayer = lordPlayer;
    pokeGame.lordPlayerId = lordPlayer.userId;
    lordPlayer.state = PlayerState.PLAYING;
    nextPlayer.state = PlayerState.PLAYING;
    prevPlayer.state = PlayerState.PLAYING;
  }

  var msgBack = {};
  var excludedPlayerAttrs = ['nickName', 'headIcon'];
  if (isGiveUp) {
    // 流局
    msgBack = {
      lordValue: 0,
      lordUserId: 0,
      userId: player.userId,
      nextUserId: 0,
      grabUserId: player.userId,
      grabState: grabState,
      abandoned: true,
      players: [
        pokeGame.players[0].toParams(excludedPlayerAttrs),
        pokeGame.players[1].toParams(excludedPlayerAttrs),
        pokeGame.players[2].toParams(excludedPlayerAttrs)
      ]
    }
  } else if (isGrabLordFinish) {
    // 叫地主结束
    // 返回信息
    msgBack = {
      lordValue: pokeGame.lordValue,
      lordUserId: pokeGame.lordPlayerId,
      nextUserId: pokeGame.lordPlayerId,
      grabState: grabState,
      userId: player.userId,
      lordPokeCards: CardUtil.pokeCardsToString(table.lordPokeCards),
      players: [
        pokeGame.players[0].toParams(excludedPlayerAttrs),
        pokeGame.players[1].toParams(excludedPlayerAttrs),
        pokeGame.players[2].toParams(excludedPlayerAttrs)
      ]
    };
  } else {
    // 叫地主环节未结束，继续由下一玩家叫地主
    nextPlayer = pokeGame.getNextPlayer(player.userId);
    if (nextPlayer.state == PlayerState.NO_GRAB_LORD) {
      nextPlayer = pokeGame.getNextPlayer(nextPlayer.userId);
    }

    msgBack = {
      lordValue: pokeGame.grabbingLord.lordValue,
      lordUserId: 0,
      grabState: grabState,
      userId: player.userId,
      nextUserId: nextPlayer.userId,
      players: [
        pokeGame.players[0].toParams(excludedPlayerAttrs),
        pokeGame.players[1].toParams(excludedPlayerAttrs),
        pokeGame.players[2].toParams(excludedPlayerAttrs)
      ]
    }
  }

  utils.invokeCallback(cb, null, msgBack);
};