/**
 * Created by edwardzhou on 14-8-6.
 */

var PokeCardValue = require('../consts/consts').PokeCardValue;
var cardUtil = require('./cardUtil');
var Card = require('../domain/card');

var sortAscBy = function(field) {
  return function(a, b) {
    return a[field] - b[field];
  };
};

var sortDescBy = function(field) {
  return function (a, b) {
    return a[field] - b[field];
  };
};

Array.prototype.append = function(otherArray) {
  for (var index=0; index<otherArray.length; index++) {
    this.push(otherArray[index]);
  }
  return this;
};

var copyGroups = function(srcGroups, dstGroups) {
  for (var index=0; index<srcGroups.length; index++) {
    dstGroups.push(srcGroups[index].slice(0));
  }
};

var removeGroup = function(groups, groupRemove) {
  //for (groups)
}

var groupsToString = function( groups ) {
  return groups.data.map( function(group) {
    return group.pokeCards.map(function(p) { return p.valueChar; }).join('');
  }).join(", ");
};

var cardsToString = function( cards ) {
  return cards.map( function(card) {
    return card.pokeCards.map(function(p) { return p.valueChar; }).join('');
  }).join(", ");
};


var PokeGroup = function(pokes) {
  this.pokeCards = pokes.slice(0);
  this.pokeValue = this.pokeCards[0].value;
  this.pokeValueChar = this.pokeCards[0].valueChar;
  this.pokeCount = this.pokeCards.length;
};

PokeGroup.prototype.get = function(index) {
  return this.pokeCards[index];
};

PokeGroup.prototype.push = function(poke) {
  this.pokeCards.push(poke);
  this.pokeCount = this.pokeCards.length;
  return this;
};

PokeGroup.prototype.clone = function() {
  return new PokeGroup(this.pokeCards);
};

PokeGroup.prototype.equals = function(other) {
  if (other == null)
    return false;

  return this.pokeValue == other.pokeValue && this.pokeCount == other.pokeCount;
};

Object.defineProperty(PokeGroup.prototype, 'length', {
  enumerable: false,
  get: function() { return this.pokeCards.length }
});


var PokeGroupArray = function() {
  this.data = [];
};

PokeGroupArray.prototype.add = function(pokeGroup) {
  this.data.push(pokeGroup);
  return this;
};

PokeGroupArray.prototype.push = function(pokeGroup) {
  return this.add(pokeGroup);
};

PokeGroupArray.prototype.remove = function(pokeGroup) {
  var index = this.findIndex(pokeGroup);
  if (index < 0)
    return null;

  var group = this.data.splice(index, 1);
  return group;
};

PokeGroupArray.prototype.findIndex = function(pokeGroup) {
  for (var index=0; index<this.data.length; index++) {
    if (this.data[index].equals(pokeGroup)) {
      return index;
    }
  }

  return -1;
};

PokeGroupArray.prototype.findIndexByPokeValue = function(pokeValue) {
  for (var index=0; index< this.data.length; index++) {
    if (this.data[index].pokeValue == pokeValue)
      return index;
  }

  return -1;
};

PokeGroupArray.prototype.getGroupByPokeValue = function(pokeValue) {
  var index = this.findIndexByPokeValue(pokeValue);
  if (index < 0)
    return null;

  return this.data[index];
};

PokeGroupArray.prototype.get = function(index) {
  return this.data[index];
};

Object.defineProperty(PokeGroupArray.prototype, 'length', {
  enumerable: false,
  get: function() { return this.data.length }
});


PokeGroupArray.prototype.clone = function() {
  var newGroupArray = new PokeGroupArray();
  for (var index=0; index<this.data.length; index++) {
    newGroupArray.data.push(this.data[index].clone());
  }
  return newGroupArray;
};

PokeGroupArray.prototype.removeGroups = function(groups) {
  var removedGroups = [];
  for (var index=0; index<groups.length; index++) {
    var g = this.remove(groups.get(index));
    if (!!g)
      removedGroups.push(g);
  }

  return removedGroups;
};



var CardInfo = function() {
  //var pokeCards = opts.pokeCards.slice(0);
  this.pokeCards = [];
  this.groups = [];
  this.groupsMap = {};
  this.bombs = [];
  this.threes = [];
  this.pairs = [];
  this.signles = [];
  this.rockets = [];
  this.possibleStraights = [];
  this.workingGroups = [];
};

CardInfo.prototype.clone = function() {
  var newCardInfo = new CardInfo();
  newCardInfo.pokeCards = this.pokeCards.slice(0);

  for(var key in this.groupsMap) {
    newCardInfo.groupsMap[key] = this.groupsMap[key].slice(0);
  }


  copyGroups(this.groups, newCardInfo.groups);
  copyGroups(this.bombs, newCardInfo.bombs);
  copyGroups(this.threes, newCardInfo.threes);
  copyGroups(this.pairs, newCardInfo.pairs);
  copyGroups(this.signles, newCardInfo.signles);
  copyGroups(this.rockets, newCardInfo.rockets);
  copyGroups(this.signles, newCardInfo.signles);
  copyGroups(this.possibleStraights, newCardInfo.possibleStraights);
  copyGroups(this.workingGroups, newCardInfo.workingGroups);

  return newCardInfo;
};

CardInfo.create = function(pokeCards) {

  pokeCards = pokeCards.slice(0);
  pokeCards.sort(sortAscBy('pokeIndex'));

  var groupsMap = {};
  var pokeGroups = new PokeGroupArray();
  var group = [];

  for (var index=0; index<pokeCards.length; index++) {
    if (group.length == 0) {
      group.push(pokeCards[index]);
//      groupsMap[pokeCards[index].value] = group;
    } else if (group[0].value == pokeCards[index].value) {
      group.push(pokeCards[index]);
    } else {
      pokeGroups.push(new PokeGroup(group));
      group = [];
      group.push(pokeCards[index]);
      //groupsMap[pokeCards[index].value] = group;
    }
  }
  pokeGroups.push(new PokeGroup(group));

  var cardInfo = new CardInfo();
  cardInfo.pokeCards = pokeCards;
  cardInfo.groups = pokeGroups;
  //cardInfo.groupsMap = groupsMap;

  cardInfo.bombs = CardInfo.getBombs(pokeGroups);
  cardInfo.threes = CardInfo.getThrees(pokeGroups);
  cardInfo.pairs = CardInfo.getPairs(pokeGroups);
  cardInfo.singles = CardInfo.getSingles(pokeGroups);
  cardInfo.rockets = CardInfo.getRockets(pokeGroups);

  cardInfo.possibleStraights = CardInfo.findPossibleStraights(pokeGroups);

  return cardInfo;
};

CardInfo.getBombs = function (pokeGroups) {
  var bombs = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 4)
      bombs.push(group);
  }

  return bombs;
};

CardInfo.getThrees = function (pokeGroups) {
  var threes = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 3)
      threes.push(group);
  }

  return threes;
};

CardInfo.getPairs = function (pokeGroups) {
  var pairs = new PokeGroupArray();
  for (var index=0; index<pokeGroups.length; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 2)
      pairs.push(group);
  }

  return pairs;
};

CardInfo.getSingles = function (pokeGroups) {
  var singles = new PokeGroupArray();

  var count = pokeGroups.length;
  if (count>=2) {
    if ( pokeGroups.get(count-1).pokeValue == PokeCardValue.BIG_JOKER
      && pokeGroups.get(count-2).pokeValue == PokeCardValue.SMALL_JOKER) {
      count = count -2
    }
  }

  for (var index=0; index<count; index++) {
    var group = pokeGroups.get(index);
    if (group.length == 1)
      singles.push(group);
  }

  return singles;
};

CardInfo.getRockets = function (pokeGroups) {
  var rockets = new PokeGroupArray();
  var count = pokeGroups.length;

  if (count >=2
    && pokeGroups.get(count-1).pokeValue == PokeCardValue.BIG_JOKER
    && pokeGroups.get(count-2).pokeValue == PokeCardValue.SMALL_JOKER) {
    var group = [];
    group.push(pokeGroups.get(count-1).get(0));
    group.push(pokeGroups.get(count-2).get(0));
    rockets.push(new PokeGroup(group));
  }

  return rockets;
};

CardInfo.prototype.dump = function() {
  var valueChar = this.pokeCards.map(function(p) { return p.valueChar; }).join('');
  var pokeChars = this.pokeCards.map(function(p) { return p.pokeChar; }).join('');
  console.log('pokeCards: ' + valueChar);
  console.log('pokeChars: ' + pokeChars );
  console.log('groups: ', groupsToString(this.groups));
  console.log('单牌: ' + groupsToString(this.singles));
  console.log('对子: ' + groupsToString(this.pairs));
  console.log('三张: ' + groupsToString(this.threes));
  console.log('炸弹: ' + groupsToString(this.bombs));
  console.log('火箭: ' + groupsToString(this.rockets));
};

var CardResult = function() {

};

CardResult.prototype.dump = function() {
  console.log('火箭: ' + cardsToString(this.rocketsCards));
  console.log('炸弹: ' + cardsToString(this.bombsCards));
  console.log('三张: ' + cardsToString(this.threesCards));
  console.log('三顺: ' + cardsToString(this.threesStraightsCards));
  console.log('双顺: ' + cardsToString(this.pairsStraightsCards));
  console.log('对子: ' + cardsToString(this.pairsCards));
  console.log('单牌: ' );

};

var CardAnalyzer = function() {

};

CardInfo.pokeCardsFromGroups = function(groups, startIndex, count) {
  if (startIndex + count > groups.length) {
    return [];
  }

  var pokes = Array(count);
  for (var index=startIndex; index< startIndex+count; index++) {
    pokes[index-startIndex] = groups.get(index).get(0);
  }

  return pokes;
};

CardInfo.findPossibleStraights = function(groups, minLen) {
  var straights = [];
  var count = groups.length;

  minLen = minLen || 5;

  var index = 0;

  // 取前5张牌
  var pokes = CardInfo.pokeCardsFromGroups(groups, 0, minLen);
  index = minLen;

  var done = false;

  while (!done) {
    var result = cardUtil.isStraight(pokes, true);
    if (result) {
      if (pokes.length == minLen) {
        straights.push(pokes);
      }

      if (index < count) {
        pokes.push(groups.get(index).get(0));
      }
      index++;
    } else if (pokes.length > minLen) {
      pokes.pop();
      pokes = CardInfo.pokeCardsFromGroups(groups, index-1, minLen);
      index = index + minLen-1;
    } else {
      pokes.shift();
      if (index < count) {
        pokes.push(groups.get(index).get(0));
      }
      index++;
    }

    done = index > count;
  }

  return straights;
};

var groupsToCards = function(groups) {
  var cards = [];
  for (var index=0; index<groups.data.length; index++) {
    cards.push(new Card(groups.data[index].pokeCards));
  }

  return cards;
};

CardAnalyzer.analyze = function(cardInfo) {
  cardInfo.workingGroups = cardInfo.groups.clone();

  var cardResult = new CardResult();
  cardResult.bombsCards = groupsToCards(cardInfo.bombs);
  cardInfo.workingGroups.removeGroups(cardInfo.bombs);
  cardResult.rocketsCards = groupsToCards(cardInfo.rockets);
  cardInfo.workingGroups.removeGroups(cardInfo.rockets);

  CardAnalyzer.processThreesStraights(cardInfo.threes, cardResult);
  CardAnalyzer.processPairsStraights(cardInfo.pairs, cardResult);

  return cardResult;
};

CardAnalyzer.processThreesStraights = function(threesGroups, cardResult) {
  var tmpThrees = threesGroups.clone();

  var threesStraightsCards = [];

  if (tmpThrees.length >= 2) {
    var straights = CardInfo.findPossibleStraights(tmpThrees, 2);

    for (var index=0; index < straights.length; index++) {
      var pokeCards = straights[index];
      var pokes = [];
      for (var pi=0; pi<pokeCards.length; pi++) {
        var group = tmpThrees.getGroupByPokeValue(pokeCards[pi].value);
        tmpThrees.remove(group);
        pokes.append(group.pokeCards);
      }

      threesStraightsCards.push(new Card(pokes));
    }
  }

  cardResult.threesStraightsCards = threesStraightsCards;

  cardResult.threesCards = groupsToCards(tmpThrees);
};

CardAnalyzer.processPairsStraights = function(pairsGroups, cardResult) {
  var tmpPairsGroup = pairsGroups.clone();

  var pairsStraightsCards = [];

  if (tmpPairsGroup.length >= 2) {
    var straights = CardInfo.findPossibleStraights(tmpPairsGroup, 3);

    for (var index=0; index < straights.length; index++) {
      var pokeCards = straights[index];
      var pokes = [];
      for (var pi=0; pi<pokeCards.length; pi++) {
        var group = tmpPairsGroup.getGroupByPokeValue(pokeCards[pi].value);
        tmpPairsGroup.remove(group);
        pokes.append(group.pokeCards);
      }

      pairsStraightsCards.push(new Card(pokes));
    }
  }

  cardResult.pairsStraightsCards = pairsStraightsCards;

  cardResult.pairsCards = groupsToCards(tmpPairsGroup);
};


module.exports = {
  CardInfo: CardInfo,
  CardAnalyzer: CardAnalyzer
};
