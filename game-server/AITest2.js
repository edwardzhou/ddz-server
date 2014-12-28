/**
 * Created by jeffcao on 14/12/10.
 */

CardInfo = require('./app/AI/CardInfo');
PokeCard = require('./app/domain/pokeCard');
CardAnalyzer = require('./app/AI/CardAnalyzer');
cardUtil = require('./app/util/cardUtil');
Card = require('./app/domain/card');
AIEngine = require('./app/AI/AIEngine');
var Combinatorics = require('js-combinatorics').Combinatorics;

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

//var gamePokes = PokeCard.shuffle();
//var pokes = gamePokes.slice(0, 17);
//var farmer1_pokes = gamePokes.slice(17, 34);
//var farmer2_pokes = gamePokes.slice(34, 51);
//
//pokes = PokeCard.pokeCardsFromChars('AHKNTU\\`abqrstuv');
//
//console.time('CardInfo create');
//ci = CardInfo.create(pokes);
//console.timeEnd('CardInfo create');
//ci.dump();


PokeCard.getAllPokeCards();

function testGetSmallerThenFun() {
    //var pokes = PokeCard.getByIds("a04, b04, c04, d05, c05, a05, c08, b10");
    var pokes = PokeCard.pokeCardsFromChars('AFHMSVY[\]_`chjmu');
    console.log('pokes: ', pokes);
    var card_info = CardInfo.create(pokes);
    CardAnalyzer.analyze(card_info);
    var card = new Card(PokeCard.getByIds("c06, b06"));

    var firstCard = AIEngine.findLordPlayCard(card_info, card);

    var timeoutPokeChars = firstCard.card.getPokeChars();
    console.log(timeoutPokeChars);
}


function TestPokeCard() {
    var pokeCards1 = PokeCard.getByIds("a04, b04, c04, d05, c05, a05, c08, b10");
    var pokeCards2 = PokeCard.getByIds("a03, b03, c03, d07, c06, a09, c11, d12");

    var result = AIEngine.getBestCardInfo(pokeCards1, pokeCards2);
    //while (a = result.next()) {
    //    console.log(a);
    //}

    console.log(result.toArray().length);
}
//testGetSmallerThenFun();
TestPokeCard();