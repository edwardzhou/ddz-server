var CardType = require('../consts/consts').CardType;
var Combinatorics = require('js-combinatorics').Combinatorics;

var cardUtil = module.exports;

var _allCardTypes = {};

var _pokeCardChar = function(pokeCard) {
  return pokeCard.pokeChar;
};

var _pokeCardFieldValue = function(field) {
  return function(pokeCard) {
    return pokeCard[field];
  }
}

var _pokeCardSorter = function(pokeA, pokeB) {
  return pokeA.pokeIndex - pokeB.pokeIndex;
};

cardUtil.sortPokeCards = function(pokeCards) {
  return pokeCards.sort(_pokeCardSorter);
};

cardUtil.pokeCardsToString = function(pokeCards) {
  return pokeCards.map(_pokeCardChar).join("");
};

cardUtil.pokeCardsToIdChars = function(pokeCards) {
  return pokeCards.map(_pokeCardFieldValue('idChar')).join('');
}

cardUtil.getCardType = function (pokeCards) {
  var pokeCardIdChars = cardUtil.pokeCardsToIdChars(cardUtil.sortPokeCards(pokeCards));

  var cardType = _allCardTypes[pokeCardIdChars];
  //console.log('cardType for %s: ', pokeCardIdChars, cardType);

  return cardType;
};

cardUtil.checkCardType = function (card) {
  card.cardType = CardType.NONE;

  var pokeCardIdChars = cardUtil.pokeCardsToIdChars(cardUtil.sortPokeCards(card.pokeCards));

  var ctype = _allCardTypes[pokeCardIdChars];
  if (!!ctype) {
    card.cardType = ctype.cardType;
    card.cardLength = ctype.cardLength;
    card.maxPokeValue = ctype.maxPokeValue;
  }

  return (card.cardType != CardType.NONE);
};

cardUtil.compare = function(cardA, cardB) {
  if (!cardA || !cardB)
    return false;
  // 火箭最大
  if (cardA.isRocket())
    return true;
  if (cardB.isRocket())
    return false;

  // 必须都是有效牌型
  if (!cardA.isValid() || !cardB.isValid())
    return false;

  // 牌型不同，则判断 A 是否为炸弹
  if (cardA.cardType != cardB.cardType)
    return cardA.isBomb();

  // 牌型相同，且牌数也必须相同，才能比较
  if (cardA.pokeCards.length != cardB.pokeCards.length)
    return false;

  // 比较最大牌值
  return (cardA.maxPokeValue > cardB.maxPokeValue);
};

cardUtil.buildCardTypes = function() {

  if (_allCardTypes['A'] != null) {
    return;
  }

  var idChars =  ['3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A', '2', 'w', 'W'];
  var idValues = {'3': 3 ,  '4': 4 , '5': 5 , '6':  6 , '7': 7 , '8': 8 , '9': 9 , '0': 10 ,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'w': 16, 'W': 17};

  var getValidIdCharsCombination = function (exIndex, exLength, combLength, dup, includeJoker) {
    var seedIdChars = idChars.slice(0, idChars.length-2);
    seedIdChars.splice(exIndex, exLength);
    var addIdChars = [];
    for (var _i in seedIdChars) {
      addIdChars.push(seedIdChars[_i]);
      if (!!dup)
        addIdChars.push(seedIdChars[_i]);
    }
    if (!!includeJoker) {
      addIdChars.push('w');
      addIdChars.push('W');
    }

    var allCombChars = Combinatorics.combination(addIdChars, combLength);
    var combChars = [];
    var tmp = {}
    var cmb;
    while (cmb = allCombChars.next()) {
      var s = cmb.join('');
      if (!!tmp[s])
        continue;
      tmp[s] = true;
      combChars.push(cmb);
    }
    return combChars;
  }

  //cardUtil.getValidIdCharsCombination = getValidIdCharsCombination;

  var buildSingleCardType = function () {
    for (var index=0; index < idChars.length; index++) {
      var typeId = idChars[index];
      var cardType = {cardType: CardType.SINGLE, cardLength: 1, maxPokeValue: idValues[idChars[index]]};
      _allCardTypes[typeId] = cardType;
    }
  };

  // 生成炸弹
  var buildBombCardType = function (){
    for (var index=0; index <= 12; index++) {
      var typeId = idChars[index] + idChars[index] + idChars[index] + idChars[index];
      var cardType = {cardType: CardType.BOMB, cardLength: 1, maxPokeValue: idValues[idChars[index]]};
      _allCardTypes[typeId] = cardType;
    }
  }

  // 生成王炸
  var buildRocketCardType = function() {
    var typeId = 'wW';
    var cardType = {cardType: CardType.ROCKET, cardLength: 1, maxPokeValue: idValues['W'] };
    _allCardTypes[typeId] = cardType;
  };

  // 生成对子牌型
  var buildPairsCardType = function() {
    for (var index=0; index <= 12; index++) {
      var typeId = idChars[index] + idChars[index];
      var cardType = {cardType: CardType.PAIRS, cardLength: 1, maxPokeValue: idValues[idChars[index]]};
      _allCardTypes[typeId] = cardType;
    }
  };

  // 生成三张牌型
  var buildThreeCardType = function() {
    for (var index=0; index <=12; index++) {
      var typeId = idChars[index] + idChars[index] + idChars[index];
      var cardType = {cardType: CardType.THREE, cardLength: 1, maxPokeValue: idValues[idChars[index]]};
      _allCardTypes[typeId] = cardType;
    }
  };

  // 生成三带一牌型
  var buildThreeWithOneCardType = function() {
    for (var index=0; index <=12; index++) {
      var typeId = idChars[index] + idChars[index] + idChars[index];
      for (var sndIndex=0; sndIndex < idChars.length; sndIndex ++) {
        if (index == sndIndex)
          continue;
        var newId;
        if (index > sndIndex)
          newId = idChars[sndIndex] + typeId;
        else
          newId = typeId + idChars[sndIndex];

        var cardType = {cardType: CardType.THREE_WITH_ONE, cardLength: 1, maxPokeValue: idValues[idChars[index]]};
        _allCardTypes[newId] = cardType;
      }
    }
  };

  // 生成三带二牌型
  var buildThreeWithPairsCardType = function() {
    for (var index=0; index <=12; index++) {
      var typeId = idChars[index] + idChars[index] + idChars[index];
      for (var sndIndex=0; sndIndex < idChars.length-2; sndIndex ++) {
        if (index == sndIndex)
          continue;
        var newId;
        if (index > sndIndex)
          newId = idChars[sndIndex] + idChars[sndIndex] + typeId;
        else
          newId = typeId + idChars[sndIndex] + idChars[sndIndex];

        var cardType = {cardType: CardType.THREE_WITH_PAIRS, cardLength: 1, maxPokeValue: idValues[idChars[index]]};
        _allCardTypes[newId] = cardType;
      }
    }
  };

  // 生成二顺牌型
  var buildPairsStraightCardType = function () {
    for (var pairsLength=3; pairsLength <= 10; pairsLength++) {
      for (var index=0; index <= 12 - pairsLength; index++) {
        var typeId = '';
        for (var id=index; id<index+pairsLength; id++) {
          typeId = typeId + idChars[id] + idChars[id];
        }

        var cardType = {cardType: CardType.PAIRS_STRAIGHT,
          cardLength: pairsLength,
          maxPokeValue: idValues[ idChars[index + pairsLength - 1] ]
        };

        _allCardTypes[typeId] = cardType;
      }
    }
  };

  // 生成三顺牌型
  var buildThreeStraightCardType = function() {
    for (var pairsLength=2; pairsLength <= 7; pairsLength++) {
      for (var index=0; index <= 12 - pairsLength; index++) {
        var typeId = '';
        for (var id=index; id<index+pairsLength; id++) {
          typeId = typeId + idChars[id] + idChars[id] + idChars[id];
        }

        var cardType = {cardType: CardType.THREE_STRAIGHT,
          cardLength: pairsLength,
          maxPokeValue: idValues[ idChars[index + pairsLength - 1] ]
        };

        _allCardTypes[typeId] = cardType;
      }
    }
  };

  // 生成顺子牌型
  var buildStraightCardType = function() {
    for (var straightLength=5; straightLength<=12; straightLength++) {
      for (var index=0; (index <= 12 - straightLength); index ++) {
        var typeId = idChars.slice(index, straightLength + index).join('');
        var cardType = {cardType: CardType.STRAIGHT,
          cardLength: straightLength,
          maxPokeValue: idValues[ idChars[index + straightLength - 1] ]
        };

        _allCardTypes[typeId] = cardType;
      }
    }
  };

  // 生成飞机（三顺带单张）牌型
  var buildPlaneCardType = function () {
    for (var pairsLength=2; pairsLength <= 3; pairsLength++) {
      for (var index=0; index <= 12 - pairsLength; index++) {
        var typeId = '';
        for (var id = index; id < index + pairsLength; id++) {
          typeId = typeId + idChars[id] + idChars[id] + idChars[id];
        }

        var idCharsComb = getValidIdCharsCombination(index, pairsLength, pairsLength, true, true);
        for (var _i in idCharsComb) {
          var idArray = idCharsComb[_i];
          var newId = typeId;

          var _j = idArray.length - 1;
          while (_j>=0) {
            if ( idChars.indexOf(idArray[_j]) < index ) {
              newId = idArray.slice(0, _j+1).join('') + newId + idArray.slice(_j+1, idArray.length).join('');
              break;
            }
            _j--;
          }
          if (_j < 0)
            newId = newId + idArray.join('');

          var cardType = {cardType: CardType.PLANE,
            cardLength: pairsLength,
            maxPokeValue: idValues[ idChars[index + pairsLength - 1] ]
          };

          _allCardTypes[newId] = cardType;
        }

      }
    }
  };

  // 生成飞机带翅膀（三顺带对子）牌型
  var buildPlaneWithWingCardType = function () {
    for (var pairsLength=2; pairsLength <= 3; pairsLength++) {
      for (var index=0; index <= 12 - pairsLength; index++) {
        var typeId = '';
        for (var id = index; id < index + pairsLength; id++) {
          typeId = typeId + idChars[id] + idChars[id] + idChars[id];
        }

        var idCharsComb = getValidIdCharsCombination(index, pairsLength, pairsLength, false, false);
        for (var _i in idCharsComb) {
          var idArray = [];
          var tmpArray = idCharsComb[_i];
          for(var _ti in tmpArray) {
            idArray.push( tmpArray[_ti] );
            idArray.push( tmpArray[_ti] );
          }

          var newId = typeId;

          var _j = idArray.length - 1;
          while (_j>=0) {
            if ( idChars.indexOf(idArray[_j]) < index ) {
              newId = idArray.slice(0, _j+1).join('') + newId + idArray.slice(_j+1, idArray.length).join('');
              break;
            }
            _j--;
          }
          if (_j < 0)
            newId = newId + idArray.join('');

          var cardType = {cardType: CardType.PLANE_WITH_WING,
            cardLength: pairsLength,
            maxPokeValue: idValues[ idChars[index + pairsLength - 1] ]
          };

          _allCardTypes[newId] = cardType;
        }

      }
    }
  };

  // 生成四带二（两单张或两对）牌型
  var buildFourWithTwoCardType = function() {
    for (var index=0; index <= 12; index++) {
      var typeId = idChars[index] + idChars[index] + idChars[index] + idChars[index];

      var idCharsComb = getValidIdCharsCombination(index, 1, 2, false, true);
      for (var _i in idCharsComb) {
        var idArray = idCharsComb[_i];
        var pairsIdArray = [];
        for(var _ti in idArray) {
          pairsIdArray.push( idArray[_ti] );
          pairsIdArray.push( idArray[_ti] );
        }

        var newId = typeId;

        var _j = idArray.length - 1;
        while (_j>=0) {
          if ( idChars.indexOf(idArray[_j]) < index ) {
            newId = idArray.slice(0, _j+1).join('') + newId + idArray.slice(_j+1, idArray.length).join('');
            break;
          }
          _j--;
        }
        if (_j < 0)
          newId = newId + idArray.join('');

        var cardType = {cardType: CardType.FOUR_WITH_TWO,
          cardLength: 1,
          maxPokeValue: idValues[ idChars[index] ]
        };

        _allCardTypes[newId] = cardType;

        if (idArray.indexOf('w')>=0 || idArray.indexOf('W')>=0)
          continue;

        idArray = pairsIdArray;
        newId = typeId;

        _j = idArray.length - 1;
        while (_j>=0) {
          if ( idChars.indexOf(idArray[_j]) < index ) {
            newId = idArray.slice(0, _j+1).join('') + newId + idArray.slice(_j+1, idArray.length).join('');
            break;
          }
          _j--;
        }
        if (_j < 0)
          newId = newId + idArray.join('');

        cardType = {cardType: CardType.FOUR_WITH_TWO_PAIRS,
          cardLength: 1,
          maxPokeValue: idValues[ idChars[index] ]
        };

        _allCardTypes[newId] = cardType;


      }

    }
  };

  buildSingleCardType();
  buildBombCardType();
  buildRocketCardType();
  buildStraightCardType();
  buildPairsCardType();
  buildThreeCardType();
  buildPairsStraightCardType();
  buildThreeStraightCardType();
  buildThreeWithOneCardType();
  buildThreeWithPairsCardType();
  buildFourWithTwoCardType();
  buildPlaneCardType();
  buildPlaneWithWingCardType();

};

cardUtil.allCardTypes = _allCardTypes;