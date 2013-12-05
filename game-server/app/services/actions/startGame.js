/**
 * Created by edwardzhou on 13-12-5.
 */
var utils = require('../../util/utils');
var GameState = require('../../consts/consts').GameState;
var ErrorCode = require('../../consts/errorCode');
var PokeCard = require('../../domain/pokeCard');

var StartGameAction = function(opts) {

};

module.exports = StartGameAction;

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

  // 保存地主牌
  table.lordPokeCards = pokeCards.sort(_sortPokeCard);

  // 创建新牌局
  var newPokeGame = PokeGame.newGame(table.room.getRoomId(), table.tableId, table.players);
  newPokeGame.lordPokeCards = cardUtil.pokeCardsToString(table.lordPokeCards);

  table.pokeGame = newPokeGame;

  newPokeGame.state = GameState.GRABBING_LORD;
  newPokeGame.grabbingLord = {lastUserId: null, lordValue: 0, nextUserId: null};

  // 随机指定第一个叫地主的用户
  var lordUserIndex = (new Date()).getTime() % 3;
  var lordUserId = table.players[lordUserIndex].userId;
  table.nextUserId = lordUserId;
  table.lastUserId = null;

  newPokeGame.grabbingLord.nextUserId = lordUserId;

  utils.invokeCallback(cb, null);

};