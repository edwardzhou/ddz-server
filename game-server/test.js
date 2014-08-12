var foo = function(arg1, arg2)  {
  console.log(arg1, arg2);
};

var bar = function(callback) {
  callback(3);
};
//
//foo(1,2);
//
//bar(foo.bind(null, 4, 5));
//
//
//var dt = new Date();
//
//var s = ["one", "two", "three"];
//
//var i = s.indexOf("twox");
//
////delete s[i];
//s.splice(i, 1);
//
//console.log(s, i);
//
//for (var index in s) {
//  console.log(index, s[index]);
//}
//

cb = function(err, obj) {
  console.log('err => ', err);
  console.log('obj => ', obj);
  lastErr = err;
  lastObj = obj;
};

mongoose = require('mongoose');
mongoose.connect('mongodb://dev/new_ddz_dev');
console.log('after connected');

UserId = require('./app/domain/userId');

mongoose.connections[0].on('error', cb);

User = require('./app/domain/user');
DdzProfile = require('./app/domain/ddzProfile');
userDao = require('./app/dao/userDao');
UserSession = require('./app/domain/userSession');
GameRoom = require('./app/domain/gameRoom');
UserService = require('./app/services/userService');
cardUtil = require('./app/util/cardUtil');

zlib = require('zlib');
fs = require('fs');

zipData = fs.readFileSync('./p1.gz');
console.log(zipData);

newUserInfo = {
  handset: {

  },
  nickName: 'fooo'
};
//userDao.createUser(newUserInfo, cb);

//UserService.signInByPassword({userId: 50206, password: 'abc123'}, cb)
CardInfo = require('./app/util/CardAnalyzer').CardInfo;
PokeCard = require('./app/domain/pokeCard');
CardAnalyzer = require('./app/util/CardAnalyzer').CardAnalyzer;
var pokes = PokeCard.shuffle().slice(0, 17);
pokes = PokeCard.pokeCardsFromChars('ACEGJLMORU[]hlmntv');
ci = CardInfo.create(pokes);

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

}

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
  , 'ACEGJLMORU[]hlmntv' // 33, 44, 55, 6, 7, 8, 9, 0, Q, K, AA, 2, W
];

//for (var index=0; index<testcases.length; index++) {
//  console.log('\n\n');
//  var cardInfo = CardInfo.create( PokeCard.pokeCardsFromChars(testcases[index]));
//  var cardResult = CardAnalyzer.analyze(cardInfo);
//  cardInfo.dump();
//  cardResult.dump();
//}


//pokes = PokeCard.getByIds('a03, b04, a05, c06,a07');
//console.log(cardUtil.pokeCardsToValueString(pokes) + ' is straight ? ' + cardUtil.isStraight(pokes));
//pokes = PokeCard.getByIds('a03, b04, a05, c06,a08');
//console.log(cardUtil.pokeCardsToValueString(pokes) + ' is straight ? ' + cardUtil.isStraight(pokes));
//pokes = PokeCard.getByIds('a03, b04, a05');
//console.log(cardUtil.pokeCardsToValueString(pokes) + ' is straight ? ' + cardUtil.isStraight(pokes));
//pokes = PokeCard.getByIds('a03, b04');
//console.log(cardUtil.pokeCardsToValueString(pokes) + ' is straight ? ' + cardUtil.isStraight(pokes));
//pokes = PokeCard.getByIds('a01, b13, b12');
//console.log(cardUtil.pokeCardsToValueString(pokes) + ' is straight ? ' + cardUtil.isStraight(pokes));
//pokes = PokeCard.getByIds('a01, b02');
//console.log(cardUtil.pokeCardsToValueString(pokes) + ' is straight ? ' + cardUtil.isStraight(pokes));
////cardUtil.isStraight()
//


//
//var userSchema  =mongoose.Schema({
//  name: String,
//  password: String,
//  ex: Number
//});
//
//var User = mongoose.model('User', userSchema);
//
////var u = new User({name: 'edwardzhou', password: '123456'});
////
////u.save();
//User.find({name: 'edwardzhou'}, function(err, docs) {
//  for(var index in docs) {
//    if (index > 0) {
//      var user = docs[index];
//      user.remove();
//    } else {
//      var user = docs[index];
//      console.log(user, user instanceof User);
//      user.ex = 1;
//      user.save();
//    }
//  }
//});
//
//var MongoClient = require('mongodb').MongoClient;
//
////MongoClient.connect("mongodb://dev/mydb", {}, function(err, db) {
////  var cursor = db.collection('gameRooms').find({}).limit(1);
////  cursor.each(function(err, doc){
////    console.log(doc);
////  });
////  console.log("after cursor.each")
////});
//
//var now = new Date();
//console.log(now);
//console.log(now - dt);

//var Combinatorics = require('js-combinatorics').Combinatorics;
//
//var CardUtil = require('./app/util/cardUtil');
//CardUtil.buildCardTypes();
//var s = JSON.stringify(CardUtil.allCardTypes)
//
//var fs = require('fs');
//fs.writeFileSync('/Users/edwardzhou/temp/allCardTypes.json', s);
//
//CardUtil.buildCardTypes();
//var cc = 0;
//for( var cardId in CardUtil.allCardTypes) {
//  console.log(cardId);
//  cc ++;
//}
//
////var comb = CardUtil.getValidIdCharsCombination(0, 1, 2, false, true);
////console.log(comb);
//
//console.log(CardUtil.allCardTypes['wW'])
//
//var PokeCard = require('./app/domain/pokeCard');
//var allPokes = PokeCard.getAllPokeCards();
////console.log(allPokes);
//
//var pokes = PokeCard.shuffle();
//var pp;
//console.log('--------------shuffled------------');
////console.log(pokes);
//pp = pokes.slice(3, 5);
//console.log(CardUtil.pokeCardsToIdChars(CardUtil.sortPokeCards(pp)));
//console.log(CardUtil.getCardType(pp));
//console.log('--------------sorted------------');
////console.log(CardUtil.sortPokeCards(pokes))
//CardUtil.sortPokeCards(pokes)
//
//pp = pokes.slice(3, 7);
//console.log(CardUtil.pokeCardsToIdChars(pp));
//console.log(CardUtil.getCardType(pp));
//
//console.log(PokeCard.allPokeCardsCharMap['A']);
//console.log(PokeCard.pokeCardsFromChars('ABCDEF'));
//console.log(PokeCard.pokeCardsFromChars(['A', 'B', 'C', 'D', 'E', 'F']));
//
//var GameRoom = require ('./app/domain/gameRoom');
//
//var r = new GameRoom({roomId: 5, roomName: 'starter', ante: 300, rake: 50});
//console.log(r);
//
//console.log(r.toParams());

//mongoose = require('mongoose');
//
//mongoose.connect('mongodb://192.168.0.240/mydb');
//
//User = require('./app/domain/user');
//userDao = require('./app/dao/userDao');
//
////userDao.signIn({userId:10001, password: '123456', signInType: 2}, function(err, user) {
////  console.log('call signIn: ', err, user)
////  console.log(user.getAuthToken());
////});
//
//userDao.signIn({userId:10001, authToken: '77c52c96afab3e6f8327baa527a4bc11', signInType: 1}, function(err, user) {
//  console.log('call signIn: ', err, user)
//  console.log(user.getAuthToken());
//
//  process.exit();
//});
//
//process.nextTick(function() {
//});