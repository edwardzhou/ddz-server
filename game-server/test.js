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
userDao = require('./app/dao/userDao');
UserSession = require('./app/domain/userSession');
GameRoom = require('./app/domain/gameRoom');


zlib = require('zlib');
fs = require('fs');

zipData = fs.readFileSync('./p1.gz');
console.log(zipData);


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