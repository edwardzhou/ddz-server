var AIHelper = require('./AIHelper');

var CardResult = function() {
  this.name = "no name";
  this.singlesCards = [];
  this.pairsCards = [];
  this.threesCards = [];
  this.bombsCards = [];
  this.rocketsCards = [];
  this.pairsStraightsCards = [];
  this.threesStraightsCards = [];
  this.straightsCards = [];

  this.hands = 0;
  this.totalWeight = 0;
  this.cardInfo = null;
};

CardResult.prototype.calculate = function() {
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
  var allThreesCount = this.threesCards.length + this.threesStraightsCards.length;
  var allSinglePairCount = this.singlesCards.length + this.pairsCards.length;
  if ( allThreesCount > 0 && allThreesCount < allSinglePairCount) {
    this.hands -= allThreesCount;
  } else if (allThreesCount > 0 && allThreesCount>allSinglePairCount) {
    this.hands -= allSinglePairCount;
  }
};

CardResult.prototype.dump = function() {
  console.log('========================================');
  console.log('方案: ' + this.name + ',  手数: ' + this.hands + ',  权重: ' + this.totalWeight);
  console.log('火箭: ' + AIHelper.cardsToString(this.rocketsCards));
  console.log('炸弹: ' + AIHelper.cardsToString(this.bombsCards));
  console.log('三张: ' + AIHelper.cardsToString(this.threesCards));
  console.log('三顺: ' + AIHelper.cardsToString(this.threesStraightsCards));
  console.log('双顺: ' + AIHelper.cardsToString(this.pairsStraightsCards));
  console.log('对子: ' + AIHelper.cardsToString(this.pairsCards));
  console.log('单顺: ' + AIHelper.cardsToString(this.straightsCards));
  console.log('单牌: ' + AIHelper.cardsToString(this.singlesCards) );
  console.log('========================================');

};

module.exports = CardResult;