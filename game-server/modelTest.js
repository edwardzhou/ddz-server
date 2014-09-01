
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
DdzGoods = require('./app/domain/ddzGoods');
DdzGoodsPackage = require('./app/domain/ddzGoodsPackage');

hall = require('./app/servers/area/remote/hallRemote')();

hall.getGoodsPackages(null, null, null, cb);

