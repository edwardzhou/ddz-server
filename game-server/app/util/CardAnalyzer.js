/**
 * Created by edwardzhou on 14-8-6.
 */

var PokeCardValue = require('../consts/consts').PokeCardValue;

var sortAscBy = function(field) {
  return function(a, b) {
    return a[field] < b[field];
  };
};

var sortDescBy = function(field) {
  return function (a, b) {
    return a[field] > b[field];
  };
}

var PokeCardInfo = function(pokes) {
  this.pokecards = pokes.slice(0);
  this.pokeValue = this.pokeCards[0].value;
  this.pokeValueChar = pokeChars[0].value;
  this.pokeCount = this.pokeCards.length;
};

PokeCardInfo.prototype.push = function(pokecards) {
  this.pokecards.push(poke);
  this.pokeCount = this.pokecards.length;
  return this;
};

PokeCardInfo.protoype.clone = function() {
  return new PokeCardInfo(this.pokeCards);
};

var CardInfo = function() {
  //var pokecards = opts.pokecards.slice(0);
  this.pokecards = [];
  this.groups = [];
  this.groupsMap = {};
  this.bombs = [];
  this.threes = [];
  this.pairs = [];
  this.signles = [];
  this.rockets = [];
};

CardInfo.prototype.clone = function() {
  var newCardInfo = new CardInfo({pokecards: this.pokeCards});
  for(var key in this.valuedPokeInfos) {
    newCardInfo.valuedPokeInfos[key] = this.valuedPokeInfos[key].clone();
  }
  for(var index in this.indexedPokeInfos) {
    newCardInfo.indexedPokeInfos.push(this.indexedPokeInfos[index].clone());
  }

  return newCardInfo;
};

CardInfo.create = function(pokecards) {

  pokecards = pokecards.slice(0);
  pokecards.sort(sortAscBy('index'));

  var pokeGroups =  [];
  var group = [];
  for (var index=0; index<=pokecards.length; index++) {
    if (group.length == 0) {
      group.push(pokecards[index]);
    } else if (group[0].value == pokecards[index].value) {
      group.push(pokecards[index]);
    } else {
      pokeGroups.push(group);
      group = [];
      group.push(pokecards[index]);
    }
  }

  var cardInfo = new CardInfo();
  cardInfo.pokecards = pokecards;
  cardInfo.groups = pokeGroups;

  cardInfo.bombs = CardInfo.getBombs(pokeGroups);
  cardInfo.threes = CardInfo.getThrees(pokeGroups);
  cardInfo.pairs = CardInfo.getPairs(pokeGroups);
  cardInfo.singles = CardInfo.getSingles(pokeGroups);
  cardInfo.rockets = CardInfo.getRockets(pokeGroups);
};

CardInfo.getBombs = function (pokeGroups) {
  var bombs = [];
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups[index];
    if (group.length == 4)
      bombs.push(group);
  }

  return bombs;
};

CardInfo.getThrees = function (pokeGroups) {
  var threes = [];
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups[index];
    if (group.length == 3)
      threes.push(group);
  }

  return threes;
};

CardInfo.getPairs = function (pokeGroups) {
  var pairs = [];
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups[index];
    if (group.length == 2)
      pairs.push(group);
  }

  return pairs;
};

CardInfo.getSingles = function (pokeGroups) {
  var singles = [];
  var lastTwo = pokeGroups.slice(-2);

  for (var index=0; index<pokeGroups.length-2; index++) {
    var group = pokeGroups[index];
    if (group.length == 1)
      singlesInfos.push(group);
  }

  if (lastTwo.length == 2
    && lastTwo[0][0].value == PokeCardValue.SMALL_JOKER
    && lastTwo[1][0].value == PokeCardValue.BIG_JOKER) {
    // 最后两个是大小王
  } else {
    for (var index=0; index<lastTwo.length; index++) {
      var group = lastTwo[index];
      if (group.length == 1)
        singles.push(group);
    }
  }

  return singles;
};

CardInfo.getRockets = function (pokeGroups) {
  var rockets = [];
  var count = pokeGroups.length;

  if (count >=2
    && pokeGroups[count-1][0].pokeValue == PokeCardValue.BIG_JOKER
    && pokeGroups[count-2][0].pokeValue == PokeCardValue.SMALL_JOKER) {
    var group = [];
    group.push(pokeGroups[count-1][0]);
    group.push(pokeGroups[count-2][0]);
    rockets.push(group);
  }

  return rockets;
};


