var CardUtil = require('../../util/cardUtil');
var PokeCard = require('../../domain/pokeCard');
var utils = require('../../util/utils');
var Card = require('../../domain/card');
var ErrorCode = require('../../consts/errorCode');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

var PlayCardAction = function() {

};

module.exports = PlayCardAction;

PlayCardAction.doPlayCard = function(table, player, pokeChars, cb) {
  logger.debug('pokeChars: ', pokeChars);
  // 不出?
  if (pokeChars == '') {
    var result = {table: table, player: player, pokeCards: [], pokeChars: ''};

    utils.invokeCallback(cb, null, result);
    return true;
  }

  var pokeCards = PokeCard.pokeCardsFromChars(pokeChars);

  // 无效扑克牌
  if (pokeCards == null) {
    logger.error('invalid poke cards for: ', pokeChars);
    utils.invokeCallback(cb, {err: ErrorCode.INVALID_CARD_TYPE}, null);
    return false;
  }

  // 不是玩家手中的牌
  if (! utils.arrayIncludes(player.pokeCards, pokeCards)) {
    logger.error('%s is not owned by player [%d]', pokeChars, player.userId);
    utils.invokeCallback(cb, {err: ErrorCode.INVALID_CARD_TYPE}, null);
    return false;
  }

  // 获取牌型
  var card = new Card(pokeCards);
  // 无效牌型
  if (!card.isValid()) {
    logger.error('%s is not valid card type', pokeChars);
    utils.invokeCallback(cb, {err: ErrorCode.INVALID_CARD_TYPE}, null);
    return false;
  }



  var pokeGame = table.pokeGame;
  var lastCard = pokeGame.lastCard;

  // 当前玩家为上轮最后出牌玩家(其他两人不出)，或牌必须大于上一手出牌
  //if (pokeGame.lastUserId == null || player.userId == pokeGame.lastUserId || card.isBiggerThan(lastCard)) {
  if (true) {
    pokeGame.lastCard = card;
    pokeGame.lastUserId = player.userId;
    utils.arrayRemove(player.pokeCards, pokeCards);

    if (card.isBomb()) {
      pokeGame.score.bombs++;
    } else if (card.isRocket()) {
      pokeGame.score.rockets++;
    }

    var result = {table: table, player: player, pokeCards: pokeCards, pokeChars: pokeChars};

    utils.invokeCallback(cb, null, result);
    return true;
  }

  // 返回失败
  utils.invokeCallback(cb, {err: ErrorCode.INVALID_PLAY_CARD}, null);
};