/**
 * Created by edwardzhou on 15/4/16.
 */


var foo = function(arg1, arg2)  {
  console.log(arg1, arg2);
};

var bar = function(callback) {
  callback(3);
};

cb = function(err, obj) {
  console.log('err => ', err);
  console.log('obj => ', obj);
  lastErr = err;
  lastObj = obj;
};

mongoose = require('mongoose');
mongoose.connect('mongodb://dev2/new_ddz_dev');
console.log('after connected');

//UserId = require('./app/domain/userId');

mongoose.connections[0].on('error', cb);

User = require('../../app/domain/user');
DdzProfile = require('../../app/domain/ddzProfile');
userDao = require('../../app/dao/userDao');
UserSession = require('../../app/domain/userSession');
GameRoom = require('../../app/domain/gameRoom');
Card = require('../../app/domain/card');
UserService = require('../../app/services/userService');

results = {};

User.findOne({userId:54527})
  .populate('ddzProfile')
  .execQ()
  .then(function(u) {
    results.user = u;
    return GameRoom.findOneQ({roomId:2});
  })
  .then(function(room) {
    results.room = room;
    return UserService.doUserCoinsQtyCheckingQ(results.user, results.room);
  })
  .then(function(returnValues) {
    console.log('returnValues:', returnValues);
  })
  .fail(function(err) {
    console.error('Error: ', err);
  })
  .done();