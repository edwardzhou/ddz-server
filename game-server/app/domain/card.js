var CardType = require('../consts/consts').CardType;
var CardUtil = require('../util/cardUtil');

var Card = function(pokeCards) {
  this.cardType = CardType.NONE;
  this.pokeCards = pokeCards;
  this.maxPokeValue = 0;
  this.cardLength = 0;

  return this;
};

Card.prototype.isValid = function() {
  return this.cardType != CardType.NONE;
};

Card.prototype.isBomb = function() {
  return this.cardType == CardType.BOMB;
};

Card.prototype.isRocket = function() {
  return this.cardType == CardType.ROCKET;
};

Card.prototype.isBiggerThan = function(cardB) {
  return CardUtil.compare(this, cardB);
};

Card.prototype.getPokeCardIds = function() {
  return this.pokeCards.map(function(pokeCard){
    return pokeCard.id;
  }).join(",");
};

Card.prototype.getPokeCardString = function() {
  return CardUtil.pokeCardsToString(this.pokeCards);
};

module.exports = Card;