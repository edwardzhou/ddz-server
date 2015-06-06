/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var CardUtil = require('../util/cardUtil');
var Card = require('../domain/card');

var AIService = function(opts) {

};

module.exports = AIService;

AIService.getNextPokeCard = function(pokeGame) {
  var lastPlayer = pokeGame.getPlayerByUserId(pokeGame.lastUserId);
  var currentPlayer = pokeGame.getPlayerByUserId(pokeGame.nextUserId);

  var lastCard = new Card(pokeGame.lastCard);
  // currentPlayer.pokeCards

};