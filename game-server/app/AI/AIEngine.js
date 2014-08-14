var CardAnalyzer = require('./CardAnalyzer');
var cardUtil = require('../util/cardUtil');
var CONST = require('../consts/consts');
var CardType = CONST.CardType;
var PokeCardValue = CONST.PokeCardValue;

var AIEngine = function() {
};

AIEngine.findFeasibleStraight = function (straights) {
  if (straights.length == 0)
    return null;

  var straight = straights[0];

  if (straights.length == 1)
    return straight;

  for (var index=1; index < straights.length; index ++) {
    if (straight.cardLength < straights[index].cardLength) {
      straight = straights[index];
    }
  }

  if ((straight.cardType == CardType.STRAIGHT && straight.cardLength > 5)
    || (straight.cardType == CardType.PAIRS_STRAIGHT && straight.cardLength > 3)
    || (straight.cardType == CardType.THREE_STRAIGHT && straight.cardLength > 2)) {
    return straight;
  }

  var straight = straights[0];
  for (var index=1; index < strights.length; index++ ) {
    if (straight.maxPokeValue < straights[index].maxPokeValue) {
      straight = straights[index];
    }
  }

  return straight;
};

AIEngine.findGreaterThree = function(card, cardInfo) {
  var results = [];
  var plan = cardInfo.cardResults[0];
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    // 找出大于的三张
    if (card.maxPokeValue >= otherCard.maxPokeValue)
      continue;

    // 牌型恰好为三张
    if (card.cardType == CardType.THREE) {
      return otherCard;
    }

    // 如果是三带二
    if (card.cardType == CardType.THREE_WITH_PAIRS) {
      // 有对子，直接用，这里暂时没有考虑对2的情况是否最优 (待改进)
      if (plan.pairsCards.length>0
        //&& plan.pairsCards[0].maxPokeValue != PokeCardValue.TWO
        ) {
        return {card: new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards)), breakCard: false};
      }

      // 没对子，尝试拆连对
      var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
      if (!!pairsStraight) {
        return {card: new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0,2))),
          breakCard: pairsStraight.cardLength>3}
      }

      // 没对子、连对，拆小的三张
      if (cardIndex > 0) {
        return {card: new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0,2))), breakCard: true};
      }

      // 拆三连
      var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
      if (!!threesStraight) {
        return {card: new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0,2))),
          breakCard: true}
      }
    }
    else if (card.cardType == CardType.THREE_WITH_ONE) {
      if (plan.singlesCards.length > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.singlesCards[0].pokeCards.slice(0, 1))),
          breakCard: false
        };
      }

      if (plan.pairsCards.length > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards.slice(0, 1))),
          breakCard: false
        }
      }

      if (cardIndex > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0, 1))),
          breakCard: true
        }
      }

      var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
      if (!!threesStraight) {
        return {
          card: new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0, 1))),
          breakCard: true
        }
      }

      var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
      if (!!pairsStraight) {
        return {
          card: new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0, 1))),
          breakCard: true
        }
      }
    }
  }

  return null;
};

AIEngine.findGreaterThreesStraight = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  var optionCard = null;
  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: false
      };
    }

    if (!optionCard
      && otherCard.maxPokeValue > card.maxPokeValue
      && otherCard.cardLength > card.cardLength) {
      optionCard = otherCard;
    }
  }

  if (!!optionCard) {
    return {
      card: new Card(optionCard.pokeCards.slice(0, card.pokeCards.length)),
      breakCard: true
    };
  }

  return null;
};

AIEngine.findGreaterPairsStraight = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  var optionCard = null;
  for (var cardIndex=0; cardIndex<plan.pairsStraightsCards.length; cardIndex++ ) {
    var otherCard = plan.pairsStraightsCards[cardIndex];

    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: false
      };
    }

    if (!optionCard
      && otherCard.maxPokeValue > card.maxPokeValue
      && otherCard.cardLength > card.cardLength ) {
      optionCard = otherCard;
    }
  }

  if (!!optionCard) {
    return {
      card: new Card( optionCard.pokeCards.slice(0, card.pokeCards.length) ),
      breakCard: true
    }
  }

  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.cardLength >= card.cardLength && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = [];
      for (var index=0; index<card.cardLength; index++) {
        pokes.push(otherCard.pokeCards[index*3]);
        pokes.push(otherCard.pokeCards[index*3+1]);
      }
      return {
        card: new Card(pokes),
        breakCard: true
      };
    }
  }

  return null;
};

AIEngine.findGreaterPairs = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  for (var cardIndex=0; cardIndex<plan.pairs.length; cardIndex++) {
    var otherCard = plan.pairs[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: false
      };
    }
  }

  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength >3 && otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card( otherCard.pokeCards.slice(-2) ),
        breakCard: false
      };
    }
  }
  




};

AIEngine.findGreaterThan = function(card, cardInfo) {
  var results = [];

  switch (card.cardType) {
    case CardType.BOMB:
      for (var index=0; index<cardInfo.bombs; index++) {
        if (cardInfo.bombs[index].pokeValue > card.maxPokeValue) {
          results.push({card: new(cardInfo.bombs[index]), breakCard: false});
        }
      }
      if (cardInfo.rockets.length > 0) {
        results.push({card: new(cardInfo.rockets[0]), breakCard: false});
      }
      break;

    case CardType.FOUR_WITH_TWO_PAIRS:
      for (var index=0; index<cardInfo.bombs; index++) {
        results.push({card: new(cardInfo.bombs[index]), breakCard: false});
      }
      if (cardInfo.rockets.length > 0) {
        results.push({pokecards: cardInfo.rockets[0], breakCard: false});
      }
      break;

    case CardType.THREE_STRAIGHT:
      ;


  }

  return result;
};

AIEngine.findLordFirstCard = function(lordCardInfo, prevFarmerCardInfo, nextFarmerCardInfo) {
  var lordCardResults = lordCardInfo.cardResults;
  var prevFarmerCardResults = prevFarmerCardInfo.cardResults;
  var nextFarmerCardResults = nextFarmerCardInfo.cardResults;

  var prevPokeCount = prevFarmerCardInfo.pokeCards.length;
  var prevPokeHands = prevFarmerCardResults[0].hands;

  var nextPokeCount = nextFarmerCardInfo.pokeCards.length;
  var nextPokeHands = prevFarmerCardResults[0].hands;

  if (lordCardResults[0].hands == 1) {
    return new Card(lordCardInfo.pokeCards);
  }

  if (nextPokeHands == 1) {
    var nextCard = new Card(nextFarmerCardInfo.pokeCards);
    switch()
  }

};

AIEngine.findLordPlayCard = function(lordCardInfo, prevFarmerCardInfo, nextFarmerCardInfo, farmerCard) {

};



module.exports = AIEngine;