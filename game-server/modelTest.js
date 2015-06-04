
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
DdzProfile = require('./app/domain/ddzProfile');
User = require('./app/domain/user');
var DataKeyId = require('./app/domain/dataKeyId');
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
Player = require('./app/domain/player');
AppointPlay = require('./app/domain/appointPlay');
require('./app/domain/ArrayHelper');
taskService = require('./app/services/taskService');
MyPlayedFriend = require('./app/domain/myPlayedFriend');
MyMessageBox = require('./app/domain/myMessageBox');

AppServerInfo = require('./app/domain/appServerInfo');


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

var _genPasswordDigest = function (password, salt) {
  return crypto.createHash('md5').update(password + "_" + salt).digest('hex');
};

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

//testProcessGamingTask();

testFixUsersProfile1 = function() {
  User.findQ({})
      .then(function(users){
        console.log('1th users.count=', users.length);
        var funcs = users.map(function(user){
          return user.populateQ('ddzProfile');
        });
        return Q.all(funcs);
      })
      .then(function(users){
        console.log('2th users.count=', users.length);
        var funcs = users.map(function(user){
          if (user.ddzProfile == null || users.ddzProfile == undefined){
            ddzProfile = new DdzProfile();
            User.copyHandset(user.signedUp.handset, ddzProfile.lastSignedIn.handset);
            ddzProfile.userId = user.userId;
            ddzProfile.user_id = user.id;
            return ddzProfile.saveQ();
          }
        });
        return Q.all(funcs);
      })
      .then(function(){
        console.log("testFixUsersProfile1 done. ");
      })
      .fail(function(error){
        console.log("testFixUsersProfile1 failed. error=", error);
      })

};
var user_map = {};

testFixUsersProfile2 = function() {
  User.findQ({})
      .then(function(users){
        console.log('1th users.count=', users.length);
        var funcs = users.map(function(user){
          user_map[user.userId] = user;
          return DdzProfile.findOneQ({userId: user.userId});
        });
        return Q.all(funcs);
      })
      .then(function(ddzProfiles){
        console.log('2th ddzProfiles.count=', ddzProfiles.length);
        var funcs = ddzProfiles.map(function(ddzProfile){
          var user = user_map[ddzProfile.userId];
          user.ddzProfile = ddzProfile;
          return user.saveQ();
        });
        return Q.all(funcs);
      })
      .then(function(users){
        var funcs = users.map(function(user){
          return user.populateQ('ddzProfile');
        });
        return Q.all(funcs);
      })
      .then(function(users){
        for(var i=0;i<users.length;i++){
          var user = users[i];
          if (user.ddzProfile == null)
          {
            console.log('user.ddzProfile is null, userId=', user.userId);
          }
        }
      })
      .fail(function(error){
        console.log("testFixUsersProfile failed. error=", error);
      })
      .done(function(){
        process.exit(0);
      });

};

//testFixUsersProfile();

testGetOneDayPlayTaskInfo = function (userId) {
  var user, userTask;

  User.findOneQ({userId: userId})
      .then(function(_user) {
        user = _user;
        return taskService.getOneDayPlayUserTasksQ(user);
      })
      .then(function(_tasks) {
        console.log('_tasks.length: ', _tasks.length);
        userTask = null;
        if (_tasks != null){
          userTask = _tasks[0];
        }
        var result_info = {};
        if (userTask == null){
          result_info = {current: 60, count: 60};
        }
        else {
          result_info = {current: userTask.taskData.current, count: userTask.taskData.count};
        }
        console.log('result_info: ', result_info);
        //utils.invokeCallback(next, null, {result: true, task_info: result_info} );
      })
      .fail(function(err) {
        //logger.error('[TaskHandler.getOneDayPlayTaskInfo] error: ', err);
        //utils.invokeCallback(next, null, {result: false, err: err});
        console.log('testGetOneDayPlayTaskInfo failed: ', err);
      })
      .done(function(){
        process.exit(0);
      })
};

//testGetOneDayPlayTaskInfo(50468);

testGetUserTasks = function(userId) {
  User.findOneQ({userId: userId})
      .then(function(user) {
        //logger.info('[taskHandler.getTasks] user => ', user);
        taskService.getTaskListQ(user)
            .then(function(tasks) {
              console.log('getTaskListQ done.');
              console.log(tasks);
              //utils.invokeCallback(next, null, {tasks: tasks.toParams()});
            })
      })
      .fail(function(err) {
        console.log('testGetUserTasks failed: ', err);
        //utils.invokeCallback(next, {err: err}, null);
      })
      .done(function(){
        console.log('testGetUserTasks done: ');
        //process.exit(0);
      });
};

//testGetUserTasks(50471);

testCreateRobot = function(u_count, cb) {
  console.log('testCreateRobots u_count=',u_count);
  var userInfo = {};
  // 随机生成盐值
  var passwordSalt = crypto.createHash('md5').update(Math.random().toString()).digest('hex');
  // TODO: 此处设置缺省密码为了开发调试方便
  userInfo.password = userInfo.password || 'abc123';
  var passwordDigest = null;
  if (!!userInfo.password) {
    passwordDigest = _genPasswordDigest(userInfo.password, passwordSalt);
  }

  var userId = null;
  var results = {};
  userInfo.gender = "女";
  if (u_count%2 == 0){ userInfo.gender = "男";}

  // 生成一个新的用户ID
  DataKeyId.nextUserIdQ()
      .then(function(newUserId) {
        // 获取昵称: 如果没有提供昵称，则尝试用设备模型做昵称，若还没有设备模型，则用用户ID做昵称
        var nickName = newUserId.toString() ;
        // 确保昵称不超过八位
        if (nickName.length > 8) {
          nickName = nickName.substring(0, 8);
        }
        // 创建用户实例
        var user = new User({
          userId: newUserId,
          nickName: nickName,
          passwordDigest: passwordDigest,
          passwordSalt: passwordSalt,
          appid: userInfo.appid || 1000,
          appVersion: userInfo.appVersion,
          resVersion: userInfo.resVersion,
          created_at: (new Date()),
          updated_at: (new Date())
        });
        // 设置登录设备信息
        //user.setSignedInHandsetInfo(handsetInfo);
        // 设置注册设备信息
        //user.setSignedUpHandsetInfo(handsetInfo);
        // 更新身份令牌
        user.updateAuthToken();
        user.oldAuthToken = user.authToken;
        user.robot = true;
        user.gender = userInfo.gender;
        // 保存
        return user.saveQ();
      })
      .then(function(user) {
        results.user = user;

        var ddzProfile = new DdzProfile();
        User.copyHandset(results.user.signedUp.handset, ddzProfile.lastSignedIn.handset);
        ddzProfile.coins = 20000;
        ddzProfile.userId = results.user.userId;
        ddzProfile.user_id = results.user.id;
        return ddzProfile.saveQ();
      })
      .then(function(ddzProfile) {
        results.ddzProfile = ddzProfile;
        results.user.ddzProfile = ddzProfile;
        return results.user.saveQ();
      })
      .fail(function(error) {
        console.log('testCreateRobots faild. error=', error);
      })
      .done(function(){
        console.log('testCreateRobots done: user=%s, gender=%s', results.user.userId, results.user.gender);
        //process.exit(0);
      });
  //console.log('testCreateRobots end.');
};


testCreateRobots = function() {
  for (var i = 0; i < 2000; i++) {
    testCreateRobot(i);

  }
};

rechargeRobots = function() {
  User.find({robot: true})
    .populate('ddzProfile')
    .execQ()
    .then(function(users){
      var user;
      for (var index=0; index<users.length; index++) {
        user = users[index];
        if (user.ddzProfile.coins < 20000) {
          user.ddzProfile.coins += 20000;
          console.log('recharge user: %s, to %d', user.userId, user.ddzProfile.coins);
          user.ddzProfile.saveQ().done();
        }
      }
    })
};

fixUserHeadIcon = function() {
  var players = {};
  User.findQ({})
    .then(function(users) {
      for (var index=0; index<users.length; index++) {
        users[index].headIcon = index % 8 + 1;
        users[index].save();
        players[users[index].userId] = users[index];
      }
      return MyPlayedFriend.findQ({});
    })
    .then(function(playedFriends) {
      for (var index=0; index<playedFriends.length; index++) {
        var playedFriend = playedFriends[index];
        playedFriend.playedUsers.forEach(function(p) {
          p.headIcon = players[p.userId].headIcon;
        });
        playedFriend.friends.forEach(function(p) {
          p.headIcon = players[p.userId].headIcon;
        });
        playedFriend.markModified('playedUsers');
        playedFriend.markModified('friends');
        playedFriend.save();
      }
    })
};

testMessageHandler = function() {
  var handler = new require('./app/servers/ddz/handler/messageHandler')();
  handler.getMyMessageBox({}, {uid: 54532}, function(err, data) {
    console.log('error => ', err);
    console.log('data => ', data);
  })
  handler.getMyMessageBox({msgType: 2}, {uid: 54532}, function(err, data) {
    console.log('error => ', err);
    console.log('data => ', data);
  })
};

testMessageHandler();

//testCreateRobots();

