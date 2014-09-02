
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

setTimeout(function(){
  hall.getGoodsPackages(null, null, null, function(err, obj) {
    console.log(err, JSON.stringify(obj));
  });
}, 1000);

removeAllPackages = function () {
  DdzGoodsPackage.remove({}, cb);
};

initPackages = function () {
  var pkg = null;

  pkg = new DdzGoodsPackage({
    packageName: '黑铁宝箱',
    packageDesc: '20,000金币',
    packageIcon: 'bag1.png',
    price: 200,
    sortIndex: 1
  });
  pkg.save();

  pkg = new DdzGoodsPackage({
    packageName: '白银宝箱',
    packageDesc: '40,000金币',
    packageIcon: 'bag2.png',
    price: 400,
    sortIndex: 2
  });
  pkg.save();

  pkg = new DdzGoodsPackage({
    packageName: '钻石宝箱',
    packageDesc: '200,000金币',
    packageIcon: 'bag4.png',
    price: 1000,
    sortIndex: 4
  });
  pkg.save();

  pkg = new DdzGoodsPackage({
    packageName: '黄金宝箱',
    packageDesc: '60,000金币',
    packageIcon: 'bag3.png',
    price: 600,
    sortIndex: 3
  });
  pkg.save();
};