
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
var crypto = require('crypto');

Q = require('q');
//DdzProfile = require('./app/domain/ddzProfile');
User = require('./app/domain/user');
//GameRoom = require('./app/domain/gameRoom');
//PurchaseOrder = require('./app/domain/purchaseOrder');



testCreateRobots = function() {
    console.log('testCreateRobots');
  User.findOneQ({})
      .then(function(user){
         console.log('user:',user);
      })
      .fail(function(error){
          console.log('failed. error:', error);
      });
};

testCreateRobots();

