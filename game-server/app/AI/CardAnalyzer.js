/**
 * Created by edwardzhou on 14-8-6.
 */

var PokeCardValue = require('../consts/consts').PokeCardValue;
var cardUtil = require('./../util/cardUtil');
var Card = require('../domain/card');
var PokeGroup = require('./PokeGroup');
var PokeGroupArray = require('./PokeGroupArray');
var CardInfo = require('./CardInfo');
var CardPlan = require('./CardPlan');
var AIHelper = require('./AIHelper');

//Array.prototype.append = function(otherArray) {
//  for (var index=0; index<otherArray.length; index++) {
//    this.push(otherArray[index]);
//  }
//  return this;
//};
//
//Array.prototype.preappend = function(otherArray) {
//  Array.prototype.splice.apply(this, [0,0].concat(otherArray));
//
//  return this;
//};
//
//Array.prototype.exclude = function(otherArray) {
//  if (otherArray == null) {
//    return this;
//  }
//
//  for (var index=0; index<otherArray.length; index++) {
//    var foundIndex = this.indexOf(otherArray[index]);
//    if (foundIndex >= 0) {
//      this.splice(foundIndex, 1);
//    }
//  }
//
//  return this;
//};

appendArray = function(thisArray, otherArray) {
  //for (var index=0; index<otherArray.length; index++) {
  //  this.push(otherArray[index]);
  //}
  //return this;
  Array.prototype.splice.apply(thisArray, [thisArray.length, 0].concat(otherArray));
  return thisArray;
};

prependArray = function(thisArray, otherArray) {
  Array.prototype.splice.apply(thisArray, [0,0].concat(otherArray));

  return thisArray;
};

excludeArray = function(thisArray, otherArray) {
  if (otherArray == null) {
    return thisArray;
  }

  for (var index=0; index<otherArray.length; index++) {
    var foundIndex = thisArray.indexOf(otherArray[index]);
    if (foundIndex >= 0) {
      thisArray.splice(foundIndex, 1);
    }
  }

  return thisArray;
};


var CardAnalyzer = function() {
};

CardAnalyzer.analyze = function(cardInfo) {
  var plans = [];

  plans.push(CardAnalyzer.analyzePlanA(cardInfo));
  plans.push(CardAnalyzer.analyzePlanB(cardInfo));
  plans.push(CardAnalyzer.analyzePlanC(cardInfo));

  plans.sort(function(a,b){
    if (a.hands != b.hands)
      return a.hands - b.hands;

    return b.totalWeight - a.totalWeight;
  });

  var planIndex=0;
  while(planIndex < plans.length-1) {
    var planA = plans[planIndex];
    var planB = plans[planIndex+1];
    if (planA.hands == planB.hands && planA.totalWeight == planB.totalWeight) {
      plans.splice(planIndex+1, 1);
    } else {
      planIndex ++;
    }
  }

  cardInfo.cardPlans = plans;

  return plans;

};

CardAnalyzer.analyzePlanA = function(cardInfo) {
  cardInfo.workingGroups = cardInfo.groups.clone();

  var cardPlan = new CardPlan();
  cardPlan.name = '火箭->炸弹->三顺->三张->连对->单顺->单牌';
  cardPlan.bombsCards = AIHelper.groupsToCards(cardInfo.bombs);
  cardInfo.workingGroups.removeGroups(cardInfo.bombs);
  cardPlan.rocketsCards = AIHelper.groupsToCards(cardInfo.rockets);
  cardInfo.workingGroups.removeGroups(cardInfo.rockets);

  CardAnalyzer.processThreesStraights(cardInfo.threes, cardPlan);
  cardInfo.workingGroups.removeGroups(cardInfo.threes);

  var removedPairsGroups = CardAnalyzer.processPairsStraights(cardInfo.pairs, cardPlan);
  cardInfo.workingGroups.removeGroups(removedPairsGroups);

  var tmpWorkingGroups = CardAnalyzer.processStraights(cardInfo, cardPlan);

  var remaingPokecards = tmpWorkingGroups.getPokecards();
  if (remaingPokecards.length > 0) {
    var remaingCardInfo = CardInfo.create(remaingPokecards);
    cardPlan.singlesCards = AIHelper.groupsToCards(remaingCardInfo.singles);
    //cardPlan.pairsCards.append(AIHelper.groupsToCards(remaingCardInfo.pairs));
    appendArray(cardPlan.pairsCards, AIHelper.groupsToCards(remaingCardInfo.pairs));
  }
  cardPlan.calculate();

  return cardPlan;
};

CardAnalyzer.analyzePlanB = function(cardInfo) {
  cardInfo.workingGroups = cardInfo.groups.clone();

  var cardPlan = new CardPlan();
  cardPlan.name = '火箭->炸弹->三顺->三张->单顺->连对->对子->单牌';
  cardPlan.bombsCards = AIHelper.groupsToCards(cardInfo.bombs);
  cardInfo.workingGroups.removeGroups(cardInfo.bombs);
  cardPlan.rocketsCards = AIHelper.groupsToCards(cardInfo.rockets);
  cardInfo.workingGroups.removeGroups(cardInfo.rockets);

  CardAnalyzer.processThreesStraights(cardInfo.threes, cardPlan);
  cardInfo.workingGroups.removeGroups(cardInfo.threes);

//  var removedPairsGroups = CardAnalyzer.processPairsStraights(cardInfo.pairs, cardResult);
//  cardInfo.workingGroups.removeGroups(removedPairsGroups);

  var tmpWorkingGroups = CardAnalyzer.processStraights(cardInfo, cardPlan);

  var remaingPokecards = tmpWorkingGroups.getPokecards();
  var remaingCardInfo = CardInfo.create(remaingPokecards);


  cardPlan.singlesCards = AIHelper.groupsToCards(remaingCardInfo.singles);
  var removedPairsGroups = CardAnalyzer.processPairsStraights(remaingCardInfo.pairs, cardPlan);
  remaingCardInfo.pairs.removeGroups(removedPairsGroups);
  //cardPlan.pairsCards.append(AIHelper.groupsToCards(remaingCardInfo.pairs));
  appendArray(cardPlan.pairsCards, AIHelper.groupsToCards(remaingCardInfo.pairs));
  cardPlan.calculate();

  return cardPlan;
};


CardAnalyzer.analyzePlanC = function(cardInfo) {
  cardInfo.workingGroups = cardInfo.groups.clone();

  var cardPlan = new CardPlan();
  cardPlan.name = '火箭->炸弹->单顺->三顺->三张->连对->对子->单牌';
  cardPlan.bombsCards = AIHelper.groupsToCards(cardInfo.bombs);
  cardInfo.workingGroups.removeGroups(cardInfo.bombs);
  cardPlan.rocketsCards = AIHelper.groupsToCards(cardInfo.rockets);
  cardInfo.workingGroups.removeGroups(cardInfo.rockets);

//  CardAnalyzer.processThreesStraights(cardInfo.threes, cardResult);
//  cardInfo.workingGroups.removeGroups(cardInfo.threes);

//  var removedPairsGroups = CardAnalyzer.processPairsStraights(cardInfo.pairs, cardResult);
//  cardInfo.workingGroups.removeGroups(removedPairsGroups);

  var tmpWorkingGroups = CardAnalyzer.processStraights(cardInfo, cardPlan);

  var remaingPokecards = tmpWorkingGroups.getPokecards();
  var remaingCardInfo = CardInfo.create(remaingPokecards);


  cardPlan.singlesCards = AIHelper.groupsToCards(remaingCardInfo.singles);
  var removedPairsGroups = CardAnalyzer.processPairsStraights(remaingCardInfo.pairs, cardPlan);
  remaingCardInfo.pairs.removeGroups(removedPairsGroups);
  //cardPlan.pairsCards.append(AIHelper.groupsToCards(remaingCardInfo.pairs));
  appendArray(cardPlan.pairsCards, AIHelper.groupsToCards(remaingCardInfo.pairs));
  CardAnalyzer.processThreesStraights(remaingCardInfo.threes, cardPlan);
  //cardInfo.workingGroups.removeGroups(remaingCardInfo.threes);
  cardPlan.calculate();
  return cardPlan;
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
        //pokes.append(group.pokeCards);
        appendArray(pokes, group.pokeCards);
      }

      threesStraightsCards.push(new Card(pokes));
    }
  }

  cardResult.threesStraightsCards = threesStraightsCards;

  //cardResult.threesCards = AIHelper.groupsToCards(tmpThrees);
  appendArray(cardResult.threesCards, AIHelper.groupsToCards(tmpThrees));
};

CardAnalyzer.processStraights = function(cardInfo, cardResult) {
//  var straights = [];
//  cardResult.singlesStraights = straights;
  var tmpGroups = cardInfo.workingGroups.clone();
  if (cardInfo.possibleStraights.length == 0 || cardInfo.workingGroups.length < 5) {
    return tmpGroups;
  }

  var straights = [];
  var count = tmpGroups.length;

  var minLen = 5;

  // 生成5张的顺子
  var buildStraights = function() {
    var index = 0;
    // 取前5张牌
    var pokes = CardInfo.pokeCardsFromGroups(tmpGroups, index, minLen);
    index = minLen;

    var done = false;

    while (!done) {
      var dumpString = cardUtil.pokeCardsToValueString(pokes);
      var result = cardUtil.isStraight(pokes, true);
      if (result) {
        tmpGroups.removePokeCards(pokes);
        straights.push(pokes);
        index = 0;

        if (tmpGroups.length < minLen)
          break;

        pokes = CardInfo.pokeCardsFromGroups(tmpGroups, index, minLen);
      } else {
        pokes.shift();
        if (index < tmpGroups.length) {
          pokes.push(tmpGroups.get(index).get(0));
        }
        index++;
      }

      done = index >= (tmpGroups.length);
    }
  };

  // 扩展顺子
  var extendStraights = function() {
    for (var index=0; index<straights.length; index++) {
      var tmpIndex=0;
      var straight = straights[index];
      while (tmpIndex<tmpGroups.length) {
        var group = tmpGroups.get(tmpIndex);
        var poke = group.get(0);
        if (straight[0].value -1 == poke.value) {
          straight.unshift(poke);
        } else if (straight[straight.length-1].value + 1 == poke.value && poke.value < PokeCardValue.TWO) {
          straight.push(poke);
        } else {
          tmpIndex++;
          continue;
        }
        var g = tmpGroups.removePokeCard(poke);
        if (g.pokeCount>0)
          tmpIndex ++;
      }
    }

  };

  var findCardIndexByPokeValue = function(cards, pokeValue) {
    if (cards == null)
      return -1;

    for (var index=0; index<cards.length; index++) {
      if (cards[index].maxPokeValue == pokeValue
        || cards[index].minPokeValue == pokeValue)
        return index;
    }

    return -1;
  };

  var findStraightIndexByPokeValue = function(straights, pokeValue) {
    if (straights == null)
      return -1;

    for (var index=0; index<straights.length; index++) {
      var straight = straights[index];
      if (straight[0].value == pokeValue
        || straight[straight.length-1].value == pokeValue)
        return index;
    }

    return -1;
  };

  // 生产 5 张的单顺组
  buildStraights();
  //extendStraights();

  //console.log('[CardAnalyzer.processStraights] remaining pokes: ' , AIHelper.groupsToString(tmpGroups));

  // 在剩下牌子中，尝试拆三张，四对以上的双顺，继续组成顺子
  if (tmpGroups.length - cardInfo.threes.length > 2) {
    if (tmpGroups.length >= 4) {
      var psIndex = 0;
      while (psIndex < tmpGroups.length - 4) {
        var pokecards = CardInfo.pokeCardsFromGroups(tmpGroups, psIndex, 4);

        if (pokecards[0].value + 1 == pokecards[1].value
          && pokecards[0].value + 2 == pokecards[2].value
          && pokecards[0].value + 3 == pokecards[3].value
          && pokecards[3].value < PokeCardValue.TWO) {
          var index = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0].value - 1);
          if (index < 0) {
            index = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0].value + 4);
          }

          if (index >= 0) {
            tmpGroups.removePokeCards(pokecards);
            var card = cardResult.threesCards.splice(index, 1)[0];
            if (pokecards[0].value - 1 == card.pokeCards[0].value) {
              pokecards.unshift(card.pokeCards.shift());
            } else {
              pokecards.push(card.pokeCards.shift());
            }
            straights.push(pokecards);
            if (cardResult.pairsCards == null) {
              cardResult.pairsCards = [];
            }
            cardResult.pairsCards.push(new Card(card.pokeCards));
          } else {
            index = findCardIndexByPokeValue(cardResult.pairsStraightsCards, pokecards[0].value - 1);
            if (index < 0) {
              index = findCardIndexByPokeValue(cardResult.pairsStraightsCards, pokecards[0].value + 4);
            }
            if (index >= 0) {
              var card = cardResult.pairsStraightsCards[index];
              if (card.cardLength > 3) {
                //cardResult.pairsStraightsCards.splice(index, 1);
                tmpGroups.removePokeCards(pokecards);
                if (card.maxPokeValue == pokecards[0].value -1) {
                  pokecards.unshift(card.pokeCards.pop());
                  straights.push(pokecards);
                  tmpGroups.push(new PokeGroup(card.pokeCards.splice(-1)));
                  tmpGroups.sort();
                  cardResult.pairsStraightsCards[index] = new Card(card.pokeCards);
                  psIndex=-1;
                } else {
                  pokecards.push(card.pokeCards.shift());
                  straights.push(pokecards);
                  tmpGroups.push(new PokeGroup(card.pokeCards.splice(0,1)));
                  tmpGroups.sort();
                  cardResult.pairsStraightsCards[index] = new Card(card.pokeCards);
                  psIndex=-1;
                }
              }
            }
          }

        } else if ( pokecards[0].value + 1 == pokecards[1].value
            && pokecards[0].value + 2 == pokecards[2].value
            && pokecards[0].value + 4 == pokecards[3].value
            && pokecards[3].value < PokeCardValue.TWO) {
          var index = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0].value + 3);
          if (index >=0) {
            tmpGroups.removePokeCards(pokecards);
            var card = cardResult.threesCards.splice(index, 1)[0];
            pokecards.splice(3, 0, card.pokeCards.shift());
            straights.push(pokecards);
            tmpGroups.push(new PokeGroup(card.pokeCards));
            tmpGroups.sort();
            psIndex = -1;
//            if (cardResult.pairsCards == null) {
//              cardResult.pairsCards = [];
//            }
//            cardResult.pairsCards.push(new Card(card.pokeCards));
          }
        } else if (pokecards[0].value + 1 == pokecards[1].value
          && pokecards[0].value + 3 == pokecards[2].value
          && pokecards[0].value + 4 == pokecards[3].value
          && pokecards[3].value < PokeCardValue.TWO) {
          var index = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0].value + 2);
          if (index >=0) {
            tmpGroups.removePokeCards(pokecards);
            var card = cardResult.threesCards.splice(index, 1)[0];
            pokecards.splice(2, 0, card.pokeCards.shift());
            straights.push(pokecards);
            tmpGroups.push(new PokeGroup(card.pokeCards));
            tmpGroups.sort();
            psIndex = -1;

//            if (cardResult.pairsCards == null) {
//              cardResult.pairsCards = [];
//            }
//            cardResult.pairsCards.push(new Card(card.pokeCards));
          }
        } else if (pokecards[0].value + 2 == pokecards[1].value
          && pokecards[0].value + 3 == pokecards[2].value
          && pokecards[0].value + 4 == pokecards[3].value
          && pokecards[3].value < PokeCardValue.TWO) {
          var index = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0].value + 1);
          if (index >=0) {
            tmpGroups.removePokeCards(pokecards);
            var card = cardResult.threesCards.splice(index, 1)[0];
            pokecards.splice(1, 0, card.pokeCards.shift());
            straights.push(pokecards);
            tmpGroups.push(new PokeGroup(card.pokeCards));
            tmpGroups.sort();
            psIndex = -1;
//            if (cardResult.pairsCards == null) {
//              cardResult.pairsCards = [];
//            }
//            cardResult.pairsCards.push(new Card(card.pokeCards));
          }
        }

        psIndex++;
      }
    }

    if (tmpGroups.length >= 3) {
      var psIndex = 0;
      while (psIndex < tmpGroups.length - 3) {
        var pokecards = CardInfo.pokeCardsFromGroups(tmpGroups, psIndex, 3);

        if (pokecards[0].value + 1 == pokecards[1].value
          && pokecards[0].value + 2 == pokecards[2].value
          && pokecards[2].value < PokeCardValue.TWO) {
          var threeIndex = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0]-1);
          var straightIndex = findStraightIndexByPokeValue(straights, pokecards[0].value - 2);
          if (threeIndex <0 || straightIndex < 0) {
            threeIndex = findCardIndexByPokeValue(cardResult.threesCards, pokecards[0]+3);
            straightIndex = findStraightIndexByPokeValue(straights, pokecards[0].value + 4);
          }

          if (threeIndex >= 0 && straightIndex>=0) {
            tmpGroups.removePokeCards(pokecards);
            var card = cardResult.threesCards.splice(threeIndex, 1)[0];
            var straight = straights[straightIndex];
            if (pokecards[0].value - 1 == card.pokeCards[0].value) {
              pokecards.unshift(card.pokeCards.shift());
            } else {
              pokecards.push(card.pokeCards.shift());
            }

            if (straight[0].value == pokecards[pokecards.length-1].value + 1) {
              //straight.preappend(pokecards);
              prependArray(straight, pokecards)
            } else if (straight[straight.length-1].value == pokecards[0].value - 1) {
              //straight.append(pokecards);
              appendArray(straight, pokecards);
            }

            tmpGroups.push(new PokeGroup(card.pokeCards));
            tmpGroups.sort();
            psIndex = -1;
          }

        }
        psIndex++;
      }
    }
  }

  // 扩展顺子
  extendStraights();
  //console.log('[CardAnalyzer.processStraights] remaining pokes: ' , AIHelper.groupsToString(tmpGroups));

  // 合成双顺
  var combinePairsStraight = function() {
    var s1Index = 0;
    while (s1Index < straights.length-1) {
      var s1 = straights[s1Index];
      var s1Length = s1.length;
      for (var s2Index = s1Index+1; s2Index<straights.length; s2Index++) {
        var s2 = straights[s2Index];
        var s2Length = s2.length;

        if (s1Length == s2Length && s1[0].value == s2[0].value && s1[s1Length-1].value == s2[s1Length-1].value) {
          var pairsStraight = s1.concat(s2);
          pairsStraight.sort(AIHelper.sortAscBy('index'));
          cardResult.pairsStraightsCards.push(new Card(pairsStraight));
          straights.splice(s2Index, 1);
          straights.splice(s1Index, 1);
          s1Index--;
          break;
        }
      }
      s1Index ++;
    }
  };

  // 合成可能的双顺
  combinePairsStraight();

  // 生产单顺牌型
  for (var index=0; index<straights.length; index++) {
    cardResult.straightsCards.push(new Card(straights[index]));
  }

  // 返回剩余的牌组
  return tmpGroups;
};

CardAnalyzer.processPairsStraights = function(pairsGroups, cardResult) {
  var tmpPairsGroup = pairsGroups.clone();

  var removedGroups = new PokeGroupArray();

  var pairsStraightsCards = [];

  if (tmpPairsGroup.length >= 2) {
    var straights = CardInfo.findPossibleStraights(tmpPairsGroup, 3);

    for (var index=0; index < straights.length; index++) {
      var pokeCards = straights[index];
      var pokes = [];
      for (var pi=0; pi<pokeCards.length; pi++) {
        var group = tmpPairsGroup.getGroupByPokeValue(pokeCards[pi].value);
        tmpPairsGroup.remove(group);
        removedGroups.push(group);
        //pokes.append(group.pokeCards);
        appendArray(pokes, group.pokeCards);
      }

      pairsStraightsCards.push(new Card(pokes));
    }
  }

  //cardResult.pairsStraightsCards.append(pairsStraightsCards);
  appendArray(cardResult.pairsStraightsCards, pairsStraightsCards);
  return removedGroups;
};


module.exports = CardAnalyzer;
