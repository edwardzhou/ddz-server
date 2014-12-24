
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

Q = require('q');
DdzProfile = require('./app/domain/ddzProfile');
User = require('./app/domain/user');
userDao = require('./app/dao/userDao');
UserSession = require('./app/domain/userSession');
GameRoom = require('./app/domain/gameRoom');
UserService = require('./app/services/userService');
DdzGoods = require('./app/domain/ddzGoods');
DdzGoodsPackage = require('./app/domain/ddzGoodsPackage');
PackagePayment = require('./app/domain/packagePayment');
PaymentMethod = require('./app/domain/paymentMethod');
PurchaseOrder = require('./app/domain/purchaseOrder');
DdzGoodsPackageService = require('./app/services/ddzGoodsPackageService');
PubSubEvent = require('./app/domain/pubSubEvent');
Channel = require('./app/domain/channel');
require('./app/domain/ArrayHelper');
taskService = require('./app/services/taskService');

TaskDef = require('./app/domain/taskDef');
UserTask = require('./app/domain/userTask');

require('./init/channelsInit');


DataKeyId = require('./app/domain/dataKeyId');

DdzGoodsPackageService.init();

HallRemote = require('./app/servers/area/remote/hallRemote');
hall = HallRemote();
cache = HallRemote.cache;
//
//setTimeout(function(){
//  hall.getGoodsPackages(null, 1000, null, function(err, obj) {
//    console.log(err, JSON.stringify(obj));
//  });
//}, 2000);

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

fixUserProfiles = function() {
  DdzProfile.findQ({})
    .then( function(ddzProfiles) {
      for (var index=0; index<ddzProfiles.length; index++) {
        var profile = ddzProfiles[index];
        console.log('profile: ', profile);
        console.log('start to profile: ', profile.userId);
        (function(p) {
          User.findOneQ({userId: p.userId})
            .then(function(user){
              console.log('start to fix user ', user.userId);
              user.ddzProfile = p;
              user.saveQ()
                .then(function(u) {
                  console.log('update user %d ddzProfile ok.', u.userId);
                })
                .fail(function(error) {
                  console.error('update user failed: ' , error);
                })
            });
        })(profile);
      }
    })
    .fail(function (error) {
      console.error('find profiles error: ', error);
    });
};

testDeliverPackage = function(poId) {
  PurchaseOrder.findOneQ({_id: poId})
    .then(function(po) {
      return DdzGoodsPackageService.deliverPackageQ(po);
    })
    .then(function() {
      console.log('ok');
    })
    .fail(function(error) {
      console.error(error);
    });
};


x = Channel.getEnabledChannelsQ().
  then(function(channels) {
    var pps = channels.map(function(channel) {
      return channel.paymentMethod.getPackagePaymentsQ();
    });
    return Q.all(pps);
  }).
  then(function(cpps) {
    mycpps = cpps;
  });

testFixUserTasks = function(user) {
  if (!!user) {
    taskService.fixUserTaskList(user);
  } else {
    User.findOneQ({})
      .then(function(_user) {
        console.log('start to fix task list for user: ', _user);
        taskService.fixUserTaskList(_user);
      })
  }
};

//testFixUserTasks();

testProcessGamingTask = function(user) {
  Q.fcall(function(){
    if (!!user)
      return user;
    return User.findOneQ({userId: 50435});
  })
    .then(function(_user) {
      taskService.processGamingTasks(_user);
    })
};

testProcessGamingTask();