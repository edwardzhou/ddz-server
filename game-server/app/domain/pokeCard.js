var format = require('util').format;
var mess = require('mess');

var PokeCardValue = require('../consts/consts').PokeCardValue;

var allPokeCards = [];
var allPokeCardsMap = {};
var allPokeCardsCharMap = {};
//var allPokeCardsIdCharMap = {};

var PokeCard = function(opts) {
  opts = opts || {};
  this.value = opts.value || PokeCardValue.NONE;
  this.id = opts.id;
  this.pokeChar = opts.pokeChar;
  this.pokeIndex = opts.pokeIndex;
  this.idChar = opts.idChar;
};

module.exports = PokeCard;

PokeCard.init = function() {
  if (allPokeCards.length > 0)
    return;

  var idChars = ['3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A', '2', 'w', 'W'];
  var indexes = [3,4,5,6,7,8,9,10,11,12,13,1,2];
  var types = ["d", "c", "b", "a"];
  var ci = 1;
  for (var i=0; i<indexes.length; i++) {
    for (var typeIndex=0; typeIndex<types.length; typeIndex++) {
      var pokeIndex = ci++;
      var pokeValue = i + 3;
      var pi = ((indexes[i]<10) ? '0' : '') + indexes[i];
      var pokeId = types[typeIndex] + pi;
      var pokeChar = String.fromCharCode(pokeIndex + 64);
      var pokeCard = new PokeCard({id:pokeId, value: pokeValue, pokeChar: pokeChar, pokeIndex: pokeIndex, idChar: idChars[i]});
      allPokeCards.push(pokeCard);
//      allPokeCardsMap[pokeCard.id] = pokeCard;
//      allPokeCardsCharMap[pokeChar] = pokeCard;
//      allPokeCardsIdCharMap[idChars[i]] = pokeCard;
    }
  }

  var pokeCard = new PokeCard({
    id:'w01',
    value: PokeCardValue.SMALL_JOKER,
    pokeChar: String.fromCharCode(ci + 64),
    pokeIndex: ci,
    idChar: idChars[13]
  });
  allPokeCards.push(pokeCard);
//  allPokeCardsMap[pokeCard.id] = pokeCard;
//  allPokeCardsCharMap[poke] = pokeCard;
//  allPokeCardsIdCharMap[idChars[i]] = pokeCard;

  ci++;
  pokeCard = new PokeCard({
    id:'w02',
    value: PokeCardValue.BIG_JOKER,
    pokeChar: String.fromCharCode(ci + 64),
    pokeIndex: ci,
    idChar: idChars[14]
  });
  allPokeCards.push(pokeCard);
//  allPokeCardsMap[pokeCard.id] = pokeCard;

  for(var index in allPokeCards) {
    var pokeCard = allPokeCards[index];
    allPokeCardsMap[pokeCard.id] = pokeCard;
    allPokeCardsCharMap[pokeCard.pokeChar] = pokeCard;
  }
};

PokeCard.getAllPokeCards = function() {
  if (allPokeCards.length == 0)
    PokeCard.init();

  return allPokeCards;
};

PokeCard.shuffle = function() {
  if (allPokeCards.length == 0)
    PokeCard.init();

  var tmpPokeCards = allPokeCards.slice(0, allPokeCards.length);
  return mess( mess(tmpPokeCards) );
};

PokeCard.getByChar = function(pokeChar) {
  return allPokeCardsCharMap[pokeChar];
};

PokeCard.pokeCardsFromChars = function(pokeChars) {
  if (!pokeChars)
    return null;

  var pokeCards = [];
  for(var index=0; index < pokeChars.length; index++) {
    var pokeCard = allPokeCardsCharMap[pokeChars[index]];
    if (pokeCard == null)
      return null;

    pokeCards.push( pokeCard );
  }

  return pokeCards;
};

PokeCard.allPokeCardsCharMap = allPokeCardsCharMap;