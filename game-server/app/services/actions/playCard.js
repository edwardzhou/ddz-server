var CardUtil = require('../../util/cardUtil');
var PokeCard = require('../../domain/pokeCard');
var utils = require('../../util/utils');
var Card = require('../../domain/card');

var PlayCardAction = function() {

};

module.exports = PlayCardAction;

PlayCardAction.doPlayCard = function(table, player, pokeChars, cb) {
  var pokeCards = PokeCard.pokeCardsFromChars(pokeChars);

  // 无效扑克牌
  if (pokeCards == null) {
    utils.invokeCallback(cb, {err: -1}, null);
    return false;
  }

  // 不是玩家手中的牌
  if (! utils.arrayIncludes(player.pokeCards, pokeCards)) {
    utils.invokeCallback(cb, {err: -2}, null);
    return false;
  }

  // 获取牌型
  var card = new Card(pokeCards);
  // 无效牌型
  if (!card.isValid()) {
    utils.invokeCallback(cb, {err:-3}, null);
    return false;
  }

  var pokeGame = table.pokeGame;
  var lastCard = pokeGame.lastCard;

  // 当前玩家为上轮最后出牌玩家(其他两人不出)，或牌必须大于上一手出牌
  if (player.userId == pokeGame.lastUserId || card.isBiggerThan(lastCard)) {
    pokeGame.lastCard = card;
    pokeGame.lastUserId = player.userId;
    utils.arrayRemove(player.pokeCards, pokeCards);

    utils.invokeCallback(cb, null, table, player, pokeCards);
    return true;
  }

  // 返回失败
  utils.invokeCallback(cb, {err:-4}, null);
};