var CardType = require('../consts/consts').CardType;
var CardTypeString = require('../consts/consts').CardTypeString;
var CardUtil = require('../util/cardUtil');
var PokeCard = require('./pokeCard');

var Card = function(pokeCards) {
  this.pokeCards = pokeCards.slice(0);

  var tmpCardType = CardUtil.getCardType(pokeCards);
  if (tmpCardType == null || tmpCardType.cardType == CardType.NONE) {
    this.cardType = CardType.NONE;
    this.maxPokeValue = 0;
    this.cardLength = 0;
  } else {
    this.cardType = tmpCardType.cardType;
    //this.maxPokeValue = tmpCardType.maxPokeValue;
    if (pokeCards.length > 0) {
      this.maxPokeValue = pokeCards[pokeCards.length - 1].value;
      this.minPokeValue = pokeCards[0].value;
    }
    this.cardLength = tmpCardType.cardLength;
  }

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

Card.prototype.toString = function() {
  return "Card[ " + PokeCard.getPokeValuesChars(this.pokeCards, true)
    + ", cardType: " + CardTypeString[this.cardType]
    + ", cardLen: " + this.cardLength
    + ", pokeLen: " + this.pokeCards.length
    + ", maxVal: " + this.maxPokeValue
//    + ", minVal: " + this.minPokeValue
    + " ]";
};

module.exports = Card;