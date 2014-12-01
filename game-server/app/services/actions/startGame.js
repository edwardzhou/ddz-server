/**
 * Created by edwardzhou on 13-12-5.
 */
var utils = require('../../util/utils');
var GameState = require('../../consts/consts').GameState;
var PlayerState = require('../../consts/consts').PlayerState;
var ErrorCode = require('../../consts/errorCode');
var PokeCard = require('../../domain/pokeCard');
var PokeGame = require('../../domain/pokeGame');
var cardUtil = require('../../util/cardUtil');

var StartGameAction = function(opts) {

};

module.exports = StartGameAction;

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

StartGameAction.execute = function(table, cb) {
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

  table.players[0].state = PlayerState.NEW_GAME;
  table.players[1].state = PlayerState.NEW_GAME;
  table.players[2].state = PlayerState.NEW_GAME;

  // 重置出牌手数
  table.players[0].plays = 0;
  table.players[1].plays = 0;
  table.players[2].plays = 0;

  // 保存地主牌
  table.lordPokeCards = pokeCards.sort(_sortPokeCard);

  // 创建新牌局
  //var newPokeGame = PokeGame.newGame(table.room.roomId, table.tableId, table.players);
  var newPokeGame = PokeGame.newGame(table);
  newPokeGame.lordCardChars = cardUtil.pokeCardsToString(table.lordPokeCards);
  newPokeGame.lordCards = table.lordPokeCards;

  table.pokeGame = newPokeGame;

  newPokeGame.state = GameState.GRABBING_LORD;
  newPokeGame.grabbingLord = {
    lastUserId: 0,
    lordValue: 0,
    nextUserId: 0,
    grabTimes: 0
  };

  // 随机指定第一个叫地主的用户
  var lordUserIndex = (new Date()).getTime() % 3;
  var lordUserId = table.players[lordUserIndex].userId;
  table.nextUserId = lordUserId;
  table.lastUserId = null;
  newPokeGame.grabbingLord.firstPlayer = table.players[lordUserIndex];
  newPokeGame.grabbingLord.firstPlayerId = lordUserId;

  newPokeGame.grabbingLord.nextUserId = lordUserId;
  newPokeGame.token = {nextUserId: lordUserId, currentSeqNo: 1};
  newPokeGame.grabbingLordTimeout = table.room.grabbingLordTimeout;
  newPokeGame.readyTimeout = table.room.readyTimeout;
  newPokeGame.playCardTimeout = table.room.playCardTimeout;
  //newPokeGame.pokeGame.lastPlay

  utils.invokeCallback(cb, null);

};