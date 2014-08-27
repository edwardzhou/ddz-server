var CardUtil = require('../../util/cardUtil');
var PokeCard = require('../../domain/pokeCard');
var utils = require('../../util/utils');
var Card = require('../../domain/card');
var ErrorCode = require('../../consts/errorCode');
var Result = require('../../domain/result');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

var PlayCardAction = function() {

};

module.exports = PlayCardAction;

PlayCardAction.doPlayCard = function(table, player, pokeChars, cb) {
  var pokeGame = table.pokeGame;
  var lastCard = pokeGame.lastCard;
  var lastPlay = pokeGame.lastPlay;

  logger.debug('pokeChars: ', pokeChars);

  // 不出?
  if ( pokeChars == '' && (!!lastPlay && lastPlay.userId != player.userId) ) {
    var resp = {table: table, player: player, pokeCards: [], pokeChars: ''};
    utils.invokeCallback(cb, null, resp);
    return true;
  }

  var pokeCards = PokeCard.pokeCardsFromChars(pokeChars);
  // 无效扑克牌
  if (pokeCards == null) {
    logger.error('invalid poke cards for: ', pokeChars);
    utils.invokeCallback(cb, new Result(ErrorCode.INVALID_CARD_TYPE, 0, '无效牌字符'), {});
    return false;
  }

  logger.info('pokes: ', PokeCard.getPokeValuesChars(pokeCards));

  // 不是玩家手中的牌
  if (! utils.arrayIncludes(player.pokeCards, pokeCards)) {
    logger.error('%s is not owned by player [%d]', pokeChars, player.userId);
    utils.invokeCallback(cb, new Result(ErrorCode.INVALID_CARD_TYPE, 1, '牌属于玩家'), {});
    return false;
  }

  // 获取牌型
  var card = new Card(pokeCards);
  // 无效牌型
  if (!card.isValid()) {
    logger.error('%s is not valid card type', pokeChars);
    utils.invokeCallback(cb, new Result(ErrorCode.INVALID_CARD_TYPE, 2, '不是有效的牌型'), {});
    return false;
  }

  if ((!!lastPlay && lastPlay.userId != player.userId) && !card.isBiggerThan(lastPlay.card)) {
    logger.error('%s is not bigger than the last card %s', card.toString(), lastPlay.card.toString());
    utils.invokeCallback(cb, new Result(ErrorCode.INVALID_CARD_TYPE, 3, '牌没有大过上家'), {});
    return false;
  }

  // 当前玩家为上轮最后出牌玩家(其他两人不出)，或牌必须大于上一手出牌
  //if (pokeGame.lastUserId == null || player.userId == pokeGame.lastUserId || card.isBiggerThan(lastCard)) {
  if (true) {
    pokeGame.lastPlay = {card: card, userId: player.userId};
    utils.arrayRemove(player.pokeCards, pokeCards);

    var resp = {table: table, player: player, pokeCards: pokeCards, pokeChars: pokeChars};
    if (card.isBomb() || card.isRocket()) {
      pokeGame.score.bombs++;
      pokeGame.lordValue *= 2;
      resp.lordValueUpgrade = true;
    }

    utils.invokeCallback(cb, null, resp);
    return true;
  }

  // 返回失败
  utils.invokeCallback(cb, new Result(ErrorCode.INVALID_PLAY_CARD, 4, '非法出牌请求'), {});
};