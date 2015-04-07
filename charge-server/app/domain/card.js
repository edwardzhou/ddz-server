var CardType = require('../consts/consts').CardType;
var CardTypeString = require('../consts/consts').CardTypeString;
var CardUtil = require('../util/cardUtil');
var PokeCard = require('./pokeCard');

var Card = function(pokeCards) {
  this.pokeCards = pokeCards.slice(0);
  CardUtil.sortPokeCards(this.pokeCards);
  this.cardType = CardType.NONE;
  this.maxPokeValue = 0;
  this.minPokeValue = 0;
  this.cardLength = 0;
  this.weight = 0;

  var tmpCardType = CardUtil.getCardType(pokeCards);
  if (!!tmpCardType && tmpCardType.cardType != CardType.NONE) {
    this.cardType = tmpCardType.cardType;
    this.maxPokeValue = tmpCardType.maxPokeValue;
    this.minPokeValue = tmpCardType.minPokeValue || pokeCards[0].value;
    this.cardLength = tmpCardType.cardLength;
    this.weight = parseInt(tmpCardType.cardValue);
    //this.calcWeight();
  }

  return this;
};

Card.prototype.calcWeight = function () {
  switch (this.cardType) {
    case CardType.ROCKET:
    case CardType.BOMB:
      this.weight = 7;
      break;

    case CardType.SINGLE:
      this.weight = 1;
      break;

    case CardType.PAIRS:
      this.weight = 2;
      break;

    case CardType.THREE:
    case CardType.THREE_WITH_ONE:
    case CardType.THREE_WITH_PAIRS:
      this.weight = 3;
      break;

    case CardType.PAIRS_STRAIGHT:
      this.weight = 5 + (this.cardLength - 3) * 2;
      break;

    case CardType.STRAIGHT:
      this.weight = 4 + (this.cardLength - 5);
      break;

    case CardType.THREE_STRAIGHT:
      this.weight = 6 + (this.cardLength-2) * 3;
      break;

    default:
      this.weight = 0;
      break;
  }
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

Card.prototype.getPokeChars = function() {
  return CardUtil.pokeCardsToPokeChars(this.pokeCards);
}

Card.prototype.getPokeCardString = function() {
  return CardUtil.pokeCardsToString(this.pokeCards);
};

Card.prototype.getPokeValueChars = function() {
  return CardUtil.pokeCardsToValueString(this.pokeCards);
};

Card.prototype.hasPokecard = function(poke) {
  for (var index=0; index<this.pokeCards.length; index++) {
    if (this.pokeCards[index].pokeIndex == poke.pokeIndex)
      return true;
  }

  return false;
};

Card.prototype.toString = function() {
  return "Card[ " + PokeCard.getPokeValuesChars(this.pokeCards, true)
    + ", cardType: " + CardTypeString[this.cardType]
    + ", cardLen: " + this.cardLength
    + ", pokeLen: " + this.pokeCards.length
    + ", maxVal: " + this.maxPokeValue
    + ", minVal: " + this.minPokeValue
    + " ]";
};

module.exports = Card;