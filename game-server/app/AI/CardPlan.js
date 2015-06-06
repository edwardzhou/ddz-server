/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var AIHelper = require('./AIHelper');

var CardPlan = function() {
  this.name = "no name";
  this.singlesCards = [];
  this.pairsCards = [];
  this.threesCards = [];
  this.bombsCards = [];
  this.rocketsCards = [];
  this.pairsStraightsCards = [];
  this.threesStraightsCards = [];
  this.straightsCards = [];

  this.allCards = [];
  this.hands = 0;
  this.totalWeight = 0;
};

CardPlan.prototype.calculate = function() {
  var sumWeight = function(a, b) {
    return a + b.weight;
  };

  this.totalWeight = 0;

  this.totalWeight += this.bombsCards.reduce(sumWeight, 0);
  this.totalWeight += this.rocketsCards.reduce(sumWeight, 0);
  this.totalWeight += this.straightsCards.reduce(sumWeight, 0);
  this.totalWeight += this.pairsStraightsCards.reduce(sumWeight, 0);
  this.totalWeight += this.threesStraightsCards.reduce(sumWeight, 0);
  this.totalWeight += this.threesCards.reduce(sumWeight, 0);
  this.totalWeight += this.singlesCards.reduce(sumWeight, 0);
  this.totalWeight += this.pairsCards.reduce(sumWeight, 0);

  this.hands += this.bombsCards.length;
  this.hands += this.rocketsCards.length;
  this.hands += this.straightsCards.length;
  this.hands += this.pairsStraightsCards.length;
  this.hands += this.threesStraightsCards.length;
  this.hands += this.threesCards.length;
  this.hands += this.singlesCards.length;
  this.hands += this.pairsCards.length;
//  var allThreesCount = this.threesCards.length + this.threesStraightsCards.reduce(function(p, c) { return p + c.cardLength; }, 0);
//  var allSinglePairCount = this.singlesCards.length + this.pairsCards.length;
//  if ( allThreesCount > 0 && allThreesCount <= allSinglePairCount) {
//    this.hands -= allThreesCount;
//  } else if (allThreesCount > 0 && allThreesCount>=allSinglePairCount) {
//    this.hands -= allSinglePairCount;
//  }
  var allSingleCount = this.singlesCards.length;
  var allPairsCount = this.pairsCards.length;
  if (this.threesStraightsCards.length > 0) {
    for (var index=0; index <this.threesStraightsCards.length; index++) {
      var card = this.threesStraightsCards[index];
      if (allSingleCount >= card.cardLength) {
        this.hands --;
        allSingleCount -= card.cardLength;
      } else if (allPairsCount >= card.cardLength ) {
        this.hands --;
        allPairsCount -= card.cardLength;
      }
    }
  }

  if (this.threesCards.length > 0) {
    var threesCount = this.threesCards.length;
    var comb = Math.min(threesCount, allSingleCount);
    threesCount -= comb;
    allSingleCount -= comb;
    this.hands -= comb;
    comb = Math.min(threesCount, allPairsCount);
    threesCount -= comb;
    allPairsCount -= comb;
    this.hands -= comb;
  }

  this.allCards.append(this.singlesCards)
    .append(this.straightsCards)
    .append(this.pairsCards)
    .append(this.pairsStraightsCards)
    .append(this.threesCards)
    .append(this.threesStraightsCards)
    .append(this.bombsCards)
    .append(this.rocketsCards);
  //appendArray(this.allCards, this.singlesCards);
  //appendArray(this.allCards, this.straightsCards);
  //appendArray(this.allCards, this.pairsCards);
  //appendArray(this.allCards, this.pairsStraightsCards);
  //appendArray(this.allCards, this.threesCards);
  //appendArray(this.allCards, this.threesStraightsCards);
  //appendArray(this.allCards, this.bombsCards);
  //appendArray(this.allCards, this.rocketsCards);
};

CardPlan.prototype.getCardByPoke = function(poke) {
  for (var cardIndex=0; cardIndex<this.allCards.length; cardIndex++) {
    if (this.allCards[cardIndex].hasPokecard(poke)) {
      return this.allCards[cardIndex];
    }
  }

  return null;
};

CardPlan.prototype.dump = function(prefix) {
  prefix = prefix || "";
  console.log( prefix+ '========================================');
  console.log(prefix+ '方案: ' + this.name + ',  手数: ' + this.hands + ',  权重: ' + this.totalWeight);
  console.log(prefix+ '火箭: ' + AIHelper.cardsToString(this.rocketsCards));
  console.log(prefix+ '炸弹: ' + AIHelper.cardsToString(this.bombsCards));
  console.log(prefix+ '三张: ' + AIHelper.cardsToString(this.threesCards));
  console.log(prefix+ '三顺: ' + AIHelper.cardsToString(this.threesStraightsCards));
  console.log(prefix+ '双顺: ' + AIHelper.cardsToString(this.pairsStraightsCards));
  console.log(prefix+ '对子: ' + AIHelper.cardsToString(this.pairsCards));
  console.log(prefix+ '单顺: ' + AIHelper.cardsToString(this.straightsCards));
  console.log(prefix+ '单牌: ' + AIHelper.cardsToString(this.singlesCards) );
  console.log(prefix+ '========================================');

};

CardPlan.prototype.dumpSimple = function(prefix) {
  prefix = prefix || "";
  console.log(prefix+ '========================================');
  console.log(prefix+ '方案: ' + this.name + ',  手数: ' + this.hands + ',  权重: ' + this.totalWeight);
  console.log(prefix+ this.allCards.map(function(card) { return card.getPokeValueChars(); }).join(', '));
  console.log(prefix+ '========================================');
};

module.exports = CardPlan;