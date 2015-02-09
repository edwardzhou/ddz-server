/**
 * Created by edwardzhou on 14-8-26.
 */
var Q = require('q');

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
User = require('./app/domain/user');
DdzProfile = require('./app/domain/ddzProfile');
DdzLoginRewards = require('./app/domain/ddzLoginRewards');

mongoose.connections[0].on('error', cb);

checkDdzProfile = function(user) {
  DdzProfile.findOneQ({userId: user.userId})
    .then(function(ddzProfile) {
      if (ddzProfile == null) {
        console.log('create ddz profile for userId ', user.userId);
        ddzProfile = new DdzProfile({userId: user.userId});
        return ddzProfile.saveQ();
      }
    })
    .done();
};

fix_profile = function() {
  User.findQ({})
    .then(function(users) {
      users.forEach(checkDdzProfile);
    });
};



