var digest = require('digest');
var utils = require('../util/utils');
var User = require('../domain/user');
var ObjectID = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;

var userDao = module.exports;

/**
 *
 * @param userId
 * @param nickName
 * @param appid
 * @param version
 * @param cb
 */
userDao.createUser = function (userId, nickName, password, appid, version, cb) {
  MongoClient.connect
  var passwordSalt = digest.createHash('md5').update(Math.random().toString()).digest('hex');
  var passwordDigest = null;
  if (!!password) {
    passwordDigest = digest.createHash('md5').update(password + "_" + passwordSalt).digest('hex');
  }
  pomelo.app.get('dbclient').collection('users').insert({
    userId: userId,
    nickName: nickName,
    passwordDigest: passwordDigest,
    passwordSalt: passwordSalt,
    appid: appid,
    version: version,
    createdAt: (new Date()),
    updatedAt: (new Date())
  }, function (err, documents) {
    if (err !== null) {
      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
    } else {
      var doc = documents[0];
      var user = new User(doc);
      utils.invokeCallback(cb, null, user);
    }
  });
};

userDao.getUserByUserId = function(userId, cb) {
  pomelo.app.get('dbclient').collection('users').findOne({userId: userId}, function(err, document){
    if (err !== null) {
      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
    } else {
      var user = null;
      if (!!document)
        user = new User(document);
      utils.invokeCallback(cb, null, user);
    }
  });
};

UserDao.getUserById = function(id, cb) {
  pomelo.app.get('dbclient').collection('users').findOne({_id: new ObjectID(id)}, function(err, document) {
    if (err !== null) {
      utils.invokeCallback(cb, {code: err.number, msg: err.message}, null);
    } else {
      var user = null;
      if (!! document)
        user = new User(document);
      utils.invokeCallback(cb, null, user);
    }
  });
};

