/**
 * Created by edwardzhou on 13-12-12.
 */

var userDao = require('../../app/dao/userDao');
var User = require('../../app/domain/user');
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var _db = null;
var data = {};

pomelo = {

  app : {
    get: function(key) {
      return data[key];
    },
    set: function(key, value) {
      data[key] = value;
    }
  }
};

mongoose.connect('mongodb://dev/mydb');


function testCreateUser() {
  userDao.createUser(10001, 'edward zhou', '123456', 1001, '1.0', function(err, user) {
    console.log('createUser: ', err, user);
  });
}

function testGetByUserId() {
//  userDao.getByUserId(10001, function(err, user) {
//    console.log('getByUserId: ', err, user);
//    user.save(function(err, data) {
//      console.log('save: ', err, data);
//    });
//  });
  User.findOne({userId: 10001}, function(err, user) {
    console.log('getByUserId: ', err, user);
    user.updatedAt = Date.now();
    user.lastSignedIn.signedInTime = Date.now();
    user.save();
  });
}

function runTest() {
  //testCreateUser();
  testGetByUserId();
}

//MongoClient.connect('mongodb://dev/mydb', {}, function(err, db) {
//  _db = db;
//  pomelo.app.set('dbclient', _db);
//
//  runTest();
//});
//

runTest();
