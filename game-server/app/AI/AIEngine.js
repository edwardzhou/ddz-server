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


AIEngine.findGreaterStraight = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  // 找刚好的单顺
  for (var cardIndex=0; cardIndex<plan.straightsCards.length; cardIndex++) {
    var otherCard = plan.straightsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: null
      };
    }
  }

  // 拆同张数的双顺
  for (var cardIndex=0; cardIndex<plan.pairsStraightsCards.length; cardIndex++) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength == card.cardLength
      && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = [];
      for (var pokeIndex=0; pokeIndex<otherCard.cardLength; pokeIndex++) {
        pokes.push(otherCard.pokeCards[pokeIndex*2]);
      }
      return {
        card: new Card(pokes),
        breakCard: otherCard
      };
    }
  }

  // 拆最大单顺
  for (var cardIndex=plan.straightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.cardLength > card.cardLength
      && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = otherCard.pokeCards.slice(0);
      for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
        if (pokes[pokeIndex].value > card.maxPokeValue) {
          pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
          return {
            card: new Card(pokes),
            breakCard: otherCard
          };
        }
      }
    }
  }

  // 拆最大双顺
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength > card.cardLength
      && otherCard.maxPokeValue > card.maxPokeValue) {
      var pokes = [];
      for (var index=0; index<otherCard.cardLength; index++){
        poke.push(otherCard.pokeCards[index*2]);
      }

      for (var pokeIndex=card.cardLength-1; pokeIndex<pokes.length; pokeIndex++) {
        if (pokes[pokeIndex].value > card.maxPokeValue) {
          pokes = pokes.slice(pokeIndex-card.cardLength+1, pokeIndex+1);
          return {
            card: new Card(pokes),
            breakCard: otherCard
          };
        }
      }
    }
  }

  return null;
};

AIEngine.findGreaterThree = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    // 找出大于的三张
    if (card.maxPokeValue >= otherCard.maxPokeValue)
      continue;

    // 牌型恰好为三张
    if (card.cardType == CardType.THREE) {
      return {
        card: otherCard,
        breakCard: null
      };
    }

    // 如果是三带二
    if (card.cardType == CardType.THREE_WITH_PAIRS) {
      // 有对子，直接用，这里暂时没有考虑对2的情况是否最优 (待改进)
      if (plan.pairsCards.length>0
        //&& plan.pairsCards[0].maxPokeValue != PokeCardValue.TWO
        ) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards)),
          breakCard: null
        };
      }

      // 没对子，尝试拆连对
      var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
      if (!!pairsStraight) {
        return {
          card: new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0,2))),
          breakCard: pairsStraight
        };
      }

      // 没对子、连对，拆小的三张
      if (cardIndex > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0,2))),
          breakCard: otherCard
        };
      }

      // 拆三连
      var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
      if (!!threesStraight) {
        return {
          card: new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0,2))),
          breakCard: threesStraight
        };
      }
    }
    else if (card.cardType == CardType.THREE_WITH_ONE) {
      if (plan.singlesCards.length > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.singlesCards[0].pokeCards.slice(0, 1))),
          breakCard: null
        };
      }

      if (plan.pairsCards.length > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.pairsCards[0].pokeCards.slice(0, 1))),
          breakCard: null
        }
      }

      if (cardIndex > 0) {
        return {
          card: new Card(otherCard.pokeCards.concat(plan.threesCards[0].pokeCards.slice(0, 1))),
          breakCard: plan.threesCards[0]
        }
      }

      var threesStraight = AIEngine.findFeasibleStraight(plan.threesStraightsCards);
      if (!!threesStraight) {
        return {
          card: new Card(otherCard.pokeCards.concat(threesStraight.pokeCards.slice(0, 1))),
          breakCard: threesStraight
        }
      }

      var pairsStraight = AIEngine.findFeasibleStraight(plan.pairsStraightsCards);
      if (!!pairsStraight) {
        return {
          card: new Card(otherCard.pokeCards.concat(pairsStraight.pokeCards.slice(0, 1))),
          breakCard: pairsStraight
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
        breakCard: null
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
      breakCard: optionCard
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
        breakCard: null
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
      breakCard: optionCard
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
        breakCard: otherCard
      };
    }
  }

  return null;
};

/**
 * 找出比card大的可能对子
 * @param card
 * @param cardInfo
 * @returns {*}
 */
AIEngine.findGreaterPairs = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  // 先在对子里找最小对子
  for (var cardIndex=0; cardIndex<plan.pairsCards.length; cardIndex++) {
    var otherCard = plan.pairsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: null
      };
    }
  }

  // 拆三对以上的双顺的最大对子
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.cardLength >3 && otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card( otherCard.pokeCards.slice(-2) ),
        breakCard: otherCard
      };
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[index];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card( otherCard.pokeCards.slice(0,2)),
        breakCard: otherCard
      }
    }
  }

  // 拆双顺
  for (var cardIndex=plan.pairsStraightsCards.length-1; cardIndex>=0; cardIndex--) {
    var otherCard = plan.pairsStraightsCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card( otherCard.pokeCards.slice(-2) ),
        breakCard: otherCard
      };
    }
  }

  // 拆双顺
  for (var cardIndex=0; cardIndex<plan.threesStraightsCards.length; cardIndex++) {
    var otherCard = plan.threesStraightsCards[cardIndex];
    if (otherCard.minPokeValue > card.maxPokeValue) {
      return {
        card: new Card( otherCard.pokeCard.slice(0, 2)),
        breakCard: otherCard
      };
    }
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card( otherCard.pokeCards.slice(-2) ),
        breakCard: otherCard
      };
    }
  }

  return null;
};

AIEngine.findGreaterSingle = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  // 找最小单牌
  for (var cardIndex=0; cardIndex<plan.singlesCards.length; cardIndex++) {
    var otherCard = plan.singlesCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: null
      };
    }
  }

  // 拆二
  var group = cardInfo.groups.getGroupByPokeValue(PokeCardValue.TWO);
  if (!!group) {
    return {
      card: new Card(group.pokeCards.slice(0, 1)),
      breakCard: plan.getCardByPoke(group.pokeCards[0])
    };
  }

  // 拆对牌
  for (var cardIndex=0; cardIndex<plan.pairsCards.length; cardIndex++) {
    var otherCard = plan.pairsCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card(otherCard.pokeCards.slice(0,1)),
        breakCard: otherCard
      };
    }
  }

  // 拆6张以上的单顺的顶张
  for (var cardIndex=0; cardIndex<plan.straightsCards.length; cardIndex++) {
    var otherCard = plan.straightsCards[cardIndex];
    if (otherCard.cardLength > 5 && otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card(otherCard.pokeCards.slice(-1)),
        breakCard: otherCard
      };
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card(otherCard.pokeCards.slice(0,1)),
        breakCard: otherCard
      };
    }
  }

  // 拆三张
  for (var cardIndex=0; cardIndex<plan.threesCards.length; cardIndex++) {
    var otherCard = plan.threesCards[cardIndex];
    if (otherCard.maxPokeValue > card.maxPokeValue) {
      return {
        card: new Card(otherCard.pokeCards.slice(0,1)),
        breakCard: otherCard
      };
    }
  }

  for (var groupIndex=0; groupIndex<cardInfo.groups.length; groupIndex++) {
    var group = cardInfo.groups[groupIndex];
    if (group.pokeCards.length == 4)
      continue;

    if (group.pokeCards.length == 2
      && group.pokeCards[0].value == PokeCardValue.SMALL_JOKER) {
      continue;
    }

    if (group.pokeValue > card.maxPokeValue) {
      return {
        card: new Card(group.pokeCards.slice(0,1)),
        breakCard: plan.getCardByPoke(group.pokeCards[0])
      };
    }
  }

  return null;
};

AIEngine.findGreaterBomb = function(card, cardInfo) {
  var plan = cardInfo.cardResults[0];
  for (var cardIndex=0; cardIndex<plan.bombsCards.length; cardIndex++) {
    var otherCard = plan.bombsCards[cardIndex];
    if (cardUtil.compare(otherCard, card)) {
      return {
        card: otherCard,
        breakCard: null
      };
    }
  }

  return null;
};

AIEngine.findGreaterThan = function(card, cardInfo) {
  var result = null;
  var plan = cardInfo.cardResults[0];

  var minBombCard = null;
  var rocketCard = null;
  if (plan.bombsCards.length>0) {
    minBombCard = plan.bombsCards[0];
  }
  if (plan.rocketsCards.length>0) {
    rocketCard = plan.rocketsCards[0];
  }

  switch (card.cardType) {
    case CardType.BOMB:
    case CardType.FOUR_WITH_TWO_PAIRS:
      result = AIEngine.findGreaterBomb(card);
      if(!!result)
        return result;

      if (!!rocketCard) {
        results.push({card: new Card(rocketCard.pokeCards), breakCard: false});
      }
      break;

    case CardType.THREE_STRAIGHT:
      result = AIEngine.findGreaterThreesStraight(card, cardInfo);
      break;

    case CardType.THREE:
    case CardType.THREE_WITH_ONE:
    case CardType.THREE_WITH_PAIRS:
      result = AIEngine.findGreaterThree(card, cardInfo);
      break;

    case CardType.PAIRS_STRAIGHT:
      result = AIEngine.findGreaterPairsStraight(card, cardInfo);
      break;

    case CardType.PAIRS:
      result = AIEngine.findGreaterPairs(card, cardInfo);
      break;

    case CardType.STRAIGHT:
      result = AIEngine.findGreaterStraight(card, cardInfo);
      break;
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
    //switch()
  }

};

AIEngine.findLordPlayCard = function(lordCardInfo, prevFarmerCardInfo, nextFarmerCardInfo, farmerCard) {

};



module.exports = AIEngine;