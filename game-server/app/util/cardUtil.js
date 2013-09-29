var cardUtil = module.exports;

cardUtil.pokeCardsToString = function(pokeCards) {
  return pokeCards.map(_pokeCardChar).join("");
};

var _pokeCardChar = function(pokeCard) {
  return pokeCard.pokeChar;
};