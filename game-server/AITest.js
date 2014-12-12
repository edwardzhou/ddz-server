CardInfo = require('./app/AI/CardInfo');
PokeCard = require('./app/domain/pokeCard');
CardAnalyzer = require('./app/AI/CardAnalyzer');
cardUtil = require('./app/util/cardUtil');
Card = require('./app/domain/card');
AIEngine = require('./app/AI/AIEngine');

testcases = [
  'BCFGIKOPWZ\\_cfitv'
  , 'EJKMRTUVW[cdeijkt'
  , 'GJMRUXZ[^`cejmprs'  // 4, 5, 6, 7, 88, 99, 00, J, Q, K, AA, 22
  , 'EGJLOPQSU[]bcdfqr'  // 44, 55, 66, 77, 8, 9, 0, JJJ, Q, 22
  , 'EKTUWXY[]belnopqt'  // 4, 5, 7, 888, 99, 0, J, Q, K, AAA, 22
  , 'BDGKPSTXYZ[_ghijs'  // 33, 4, 5, 6, 77, 8, 999, 0, QQ, KK, 2
  , 'CFJKOQU[\\^_acdhnt' // 3, 4, 55, 6, 7, 8, 99, 00, JJJ, Q, A, 2
  , 'QTWXZ\\]_`abehimqr' // 77, 88, 99, 000, JJ, QQ, K, A, 22
  , 'AFHILNORXZ`egnoqu'  // 3, 44, 55, 66, 7, 8, 9, 0, QQ, AA, 2, w
  , 'ACIJMRWXYZ[]_jnpr'  // 33, 55, 6, 7, 88, 999, 00, K, AA, 2
  , 'FHINQRSUXZ\\]dghov' // 44, 5, 6, 777, 88, 99, 0, J, QQ, A, W
  , 'CDENVWXYefglnqstv'  // 33, 4, 6, 888, 9, QQQ, K, A, 222, W
  , 'AEGKUVWX_cdhijpqv'  // 3, 44, 5, 8888, 0, JJ, Q, KK, A, 2, W
  , 'BDILMNSXYafklmpqv'  // 33, 55, 66, 7, 8, 9, J, Q, KK, AA, 2, W
  , 'DKOQRSVWZ]_chkmps'  // 3, 5, 6, 777, 88, 9, 00, J, Q, K, AA, 2
  , 'BEFIMST\\]aghlmntv' // 3, 44, 5, 6, 77, 9, 0, J, QQ, K, AA, 2, W
  , 'ACEGJLMORU[]hlmntv' // 33, 44, 55, 66, 7, 8, 9, 0, Q, K, AA, 2, W
  , 'EFLMORU[]cfghmnqstu'   // 44, 5, 66, 7, 8, 9, 0, J, QQQ, AA, 222, W
  , 'ACEGJLMOQRghmnqstu'   // 44, 5, 66, 7, 8, 9, 0, J, QQQ, AA, 222, W
  , 'AHKNTU\\`abqrstuv'
];

var gamePokes = PokeCard.shuffle();
var pokes = gamePokes.slice(0, 17);
var farmer1_pokes = gamePokes.slice(17, 34);
var farmer2_pokes = gamePokes.slice(34, 51);

pokes = PokeCard.pokeCardsFromChars('AHKNTU\\`abqrstuv');

console.time('CardInfo create');
ci = CardInfo.create(pokes);
console.timeEnd('CardInfo create');


ci.dump();

pokes = CardInfo.pokeCardsFromGroups(ci.groups, 0, 5);
console.log('first 5 pokes is ' + cardUtil.pokeCardsToValueString(pokes) + '\n');

straights = CardInfo.findPossibleStraights(ci.groups);
console.log('possible straights => ', straights.length);

for(var index=0; index<straights.length; index++) {
  console.log('\t' + cardUtil.pokeCardsToValueString(straights[index]) );
}


straights = CardInfo.findPossibleStraights(ci.groups, 5, 5);
console.log('5 straights => ', straights.length);

for(var index=0; index<straights.length; index++) {
  console.log('\t' + cardUtil.pokeCardsToValueString(straights[index]) );
}
console.time('CardAnalyzer.analyze');
cardResults = CardAnalyzer.analyze(ci);
console.timeEnd('CardAnalyzer.analyze');

for (var index=0; index<cardResults.length; index++) {
  cardResults[index].dump();
  cardResults[index].dumpSimple();
}



function testAICard(card, cardInfo) {
  var testResult = AIEngine.findGreaterThan(card, cardInfo);

  if (!!testResult) {
    console.log('test ' + card.getPokeValueChars() + ', Result: ', testResult.dump());
    //var remainingPokes = cardInfo.pokeCards.slice(0).exclude(testResult.card.pokeCards);
    var remainingPokes = excludeArray(cardInfo.pokeCards.slice(0), testResult.card.pokeCards);
    var newCardInfo = CardInfo.create(remainingPokes);
    CardAnalyzer.analyze(newCardInfo);
    for (var index=0; index<newCardInfo.cardPlans.length; index++) {
      //newCardInfo.cardPlans[index].dump("\t");
      newCardInfo.cardPlans[index].dumpSimple("\t");
    }
  } else {
    console.log('no bigger than: ' , testCard.getPokeValueChars());
  }
}

console.log('---------------------------------------------')
var testCard = new Card( PokeCard.getByIds("a12, b12") );
testAICard(testCard, ci);

console.log('---------------------------------------------')
testCard = new Card( PokeCard.getByIds("a04, b04, c04") );
testAICard(testCard, ci);


console.log('---------------------------------------------')
testCard = new Card( PokeCard.getByIds("a03, b04, c05, a06, a07") );
testAICard(testCard, ci);

console.log('---------------------------------------------')
testCard = new Card( PokeCard.getByIds("a03, b04, c05, a06, a07,a08") );
testAICard(testCard, ci);

console.log('---------------------------------------------')
testCard = new Card( PokeCard.getByIds("a03, b04, c05, a06, a07,a08, a09") );
testAICard(testCard, ci);



function testFirstPlay() {
  var f1_cardInfo = CardInfo.create(farmer1_pokes);
  CardAnalyzer.analyze(f1_cardInfo);
  var f2_cardInfo = CardInfo.create(farmer2_pokes);
  CardAnalyzer.analyze(f2_cardInfo);

  var index = 1;
  var card = AIEngine.findLordFirstCard(ci, f1_cardInfo, f2_cardInfo);
  while(!!card) {
    console.log(index + ' Play: ' , card.getPokeValueChars());
    //var pokes = ci.pokeCards.slice(0).exclude(card.pokeCards);
    var pokes = excludeArray(ci.pokeCards.slice(0), card.pokeCards);
    if (pokes.length > 0) {
      ci = CardInfo.create(pokes);
      CardAnalyzer.analyze(ci);
      card = AIEngine.findLordFirstCard(ci, f1_cardInfo, f2_cardInfo);
    } else {
      card = null;
    }
    index++;
  }
}

testFirstPlay();

pokes = PokeCard.pokeCardsFromChars('Abcdfgh');
ci = CardInfo.create(pokes);
cardResults = CardAnalyzer.analyze(ci);
ci.dump();
cardResults[0].dump();



testFirstPlay();



pokes = PokeCard.pokeCardsFromChars('EKMOPZ]^acfgkmopq');
ci = CardInfo.create(pokes);
cardResults = CardAnalyzer.analyze(ci);
testCard = new Card(PokeCard.pokeCardsFromChars('FGHeh'));
testAICard(testCard, ci);
