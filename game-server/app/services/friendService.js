/**
 * Created by jeffcao on 15/4/8.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var User = require('../domain/user');
var Player = require('../domain/player');
var MyPlayed = require('../domain/myPlayed');
var MyFriend = require('../domain/myFriend');
var MyMessabeBox = require('../domain/myMessageBox');
var messageService = require('./messageService');
var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var AddFriendStatus = require('../consts/consts').AddFriendStatus;

var utils = require('../util/utils');

var FriendService = module.exports;

var genError = function (errCode) {
  var error = new Error();
  error.errCode = errCode;
  return error;
};

FriendService.init = function (app) {
  logger.info("FriendService init.");
  pomeloApp = app;

};

/**
 * 更新或增加打过牌的玩家信息
 * @param players
 * @param play_results
 */

FriendService.updatePlayWithMeUsers = function (players, play_results) {
  logger.info("[FriendService.updatePlayWithMeUsers]");
  logger.info("[FriendService.updatePlayWithMeUsers], players.length=", players.length);
  for (var i = 0; i < players.length; i++) {
    if (!players[i].robot) {
      var me_player = players[i];
      logger.info("[FriendService.updatePlayWithMeUsers], me_player=", me_player);
      var friend_players = [];
      if (i == 0) {
        friend_players = [players[1], players[2]];
      }
      if (i == 1) {
        friend_players = [players[0], players[2]];
      }
      if (i == 2) {
        friend_players = [players[0], players[1]];
      }
      logger.info("[FriendService.updatePlayWithMeUsers], friend_players.length=", friend_players.length);
      //for(var j=0;j<friend_players.length;j++) {
      //
      //}
      FriendService.doUpdatePlayWithMePlayer(me_player, friend_players);
    }
  }
};

FriendService.doUpdatePlayWithMePlayer = function (me_player, friend_players) {
  logger.info("[FriendService.doUpdatePlayWithMePlayer], friend_players=", friend_players);
  MyPlayed.findOneQ({userId: me_player.userId})
    .then(function (played_user) {
      if (played_user == null) {
        var new_played_user = new MyPlayed();
        new_played_user.user_id = me_player.id;
        new_played_user.userId = me_player.userId;
        new_played_user.playedUsers = [];
        for (var j = 0; j < friend_players.length; j++) {
          new_played_user.playedUsers.push({
            userId: friend_players[j].userId, nickName: friend_players[j].nickName,
            headIcon: friend_players[j].headIcon, gender: friend_players.gender, lastPlayed: Date.now(),
            gameStat: {won: 0, lose: 0}
          });
        }

        new_played_user.save();
        logger.info("[FriendService.doUpdatePlayWithMePlayer], new_play_whith_player:", new_played_user);
      }
      else {

        for (var j = 0; j < friend_players.length; j++) {
          var is_new_played = true;
          var friend_player = friend_players[j];
          for (var i = 0; i < played_user.playedUsers.length; i++) {
            if (played_user.playedUsers[i].userId == friend_player.userId) {
              played_user.playedUsers[i].lastPlayed = Date.now();
              is_new_played = false;
            }
          }
          if (is_new_played) {
            played_user.playedUsers.push({
              userId: friend_player.userId, nickName: friend_player.nickName,
              headIcon: friend_player.headIcon, gender: friend_player.gender, lastPlayed: Date.now()
            });
          }
        }
        played_user.markModified('playedUsers');
        played_user.save();
        logger.info("[FriendService.doUpdatePlayWithMePlayer], play_whith_player:", played_user);
      }

    });
};

FriendService.addFriend = function (userId, friend_userId, friend_msg, callback) {
  logger.info("[FriendService.addFriend], userId=", userId);
  logger.info("[FriendService.addFriend], friend_msg=", friend_msg);
  logger.info("[FriendService.addFriend], friend_userId=", friend_userId);
  var result = {};
  User.findOneQ({userId: userId})
    .then(function (user) {
      result.user = user;
      result.userInfo = result.user.toParams({only:['userId', 'nickName', 'gender', 'headIcon']});
      return MyFriend.findOneQ({userId: userId});
    })
    .then(function (my_friend) {
      if (my_friend != null && my_friend.friends != null) {
        my_friend.friends.forEach(function (friend) {
          if (friend.userId == friend_userId) {
            throw genError("already is friend");
          }
        });
      }
      return User.findOneQ({userId: friend_userId});
    })
    .then(function (friend_user) {
      result.friend_user = friend_user;
      return MyMessabeBox.findOneQ({userId: friend_userId});
    })
    .then(function (msg_box) {
      if (msg_box == null) {
        logger.info("FriendService.addFriend. new MyMessageBox");
        msg_box = new MyMessabeBox();
        msg_box.user_id = result.friend_user.id;
        msg_box.userId = result.friend_user.userId;
        msg_box.addFriendMsgs = [];
      }
      msg_box.addFriendMsgs.push({
        userId: userId,
        userInfo: result.userInfo,
        msg: friend_msg,
        status: AddFriendStatus.NEW,
        date: Date.now()
      });

      logger.info("FriendService.addFriend. msg_box.addFriendMsg:", msg_box.addFriendMsg);
      msg_box.markModified('addFriendMsgs');
      msg_box.save();

      return UserSession.findOneQ({userId: friend_userId});
    })
    .then(function (userSession) {
      logger.info("FriendService.addFriend. push message to client");
      if (userSession != null) {
        var msgData = {
          userInfo: result.userInfo,
          msg: friend_msg
        };
        var target = [{uid: result.friend_user.userId, sid: userSession.frontendId}];

        process.nextTick(function () {
          logger.info('[FriendService.addFriend] addFriendRequest.msgData: ', msgData);
          logger.info('[FriendService.addFriend] addFriendRequest.target: ', target);
          messageService.pushMessage('addFriendRequest', msgData, target);
        });
      }
    })
    .fail(function (error) {
      logger.info('[FriendService.addFriend] failed. error:', error.errCode);
      if (error.errCode != "already is friend") {
        var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
        utils.invokeCallback(callback, null, {err: errCode});
      } else {
        utils.invokeCallback(callback, null, {result: false, msg: "already is friend"});
      }
    })
    .done(function () {
      logger.info('[FriendService.addFriend] done.');
      utils.invokeCallback(callback, null, {result: true});
    });
};

FriendService.acceptFriend = function(userId, friend_userId, callback) {
  logger.info("[FriendService.acceptFriend], userId=", userId);
  logger.info("[FriendService.acceptFriend], friend_userId=", friend_userId);
  var result = {};
  var userParams = {only: ['userId', 'nickName', 'gender', 'headIcon']};

  User.findOneQ({userId: friend_userId})
    .then(function (friend_user) {
      // result.user 为加好友请求发起者
      result.friend_user = friend_user;
      return MyMessabeBox.findOneQ({userId: userId});
    })
    .then(function (msg_box) {
      // 修改被请求者的加好友消息状态

      var cur_msg = null;
      for (var index=0; index<msg_box.addFriendMsgs.length; index++) {
        if (msg_box.addFriendMsgs[index].userId == friend_userId) {
          cur_msg = msg_box.addFriendMsgs[index];
          break;
        }
      }

      cur_msg.status = AddFriendStatus.ACCEPTED;
      msg_box.markModified('addFriendMsgs');
      logger.info("FriendService.acceptFriend. msg_box.addFriendMsg:", msg_box.addFriendMsg);
      return msg_box.saveQ();
    })
    .then(function () {
      return User.findOneQ({userId: userId});
    })
    .then(function (user) {
      result.user = user;

      return MyFriend.findOneQ({userId: userId});
    })
    .then(function (selfFriends) {
      if (selfFriends == null) {
        selfFriends = new MyFriend();
        selfFriends.friends = [];
        selfFriends.user_id = result.user.id;
        selfFriends.userId = result.user.userId;
      }

      result.selfFriends = selfFriends;
      var isFriendshipExists = selfFriends.friends.filter(function(friend) {
          return friend.userId == result.friend_user.userId
        }).length > 0;
      if (!isFriendshipExists) {
        var userInfo = result.friend_user.toParams(userParams);
        userInfo.addDate = Date.now();
        result.selfFriends.friends.push(userInfo);
      }

      selfFriends.markModified('friends');
      return selfFriends.saveQ();
    })
    .then(function() {
      return MyFriend.findOneQ({userId: friend_userId});
    })
    .then(function(friendFriends) {
      if (friendFriends == null) {
        friendFriends = new MyFriend();
        friendFriends.friends = [];
        friendFriends.user_id = result.friend_user.id;
        friendFriends.userId = result.friend_user.userId;
      }
      result.friendFriends = friendFriends;
      var isFriendshipExists = friendFriends.friends.filter(function(friend) {
          return friend.userId = result.user.userId;
        }).length > 0;
      if (!isFriendshipExists) {
        var userInfo = result.user.toParams(userParams);
        userInfo.addDate = Date.now();
        result.friendFriends.friends.push(userInfo);
      }
      friendFriends.markModified('friends');
      return friendFriends.saveQ();
    })
    .then(function() {
      return UserSession.findOneQ({userId: friend_userId});
    })
    .then(function (userSession) {
      logger.info("FriendService.acceptFriend. push message to client, ");
      if (userSession != null) {
        var msgData = {userInfo: result.user.toParams(userParams), accept: 1};

        var target = [{uid: friend_userId, sid: userSession.frontendId}];
        // 向加好友请求者发送加友是否被同意消息
        process.nextTick(function () {
          logger.info('[FriendService.acceptFriend] replyFriendReqest.msgData: ', msgData);
          logger.info('[FriendService.acceptFriend] replyFriendReqest.target: ', target);
          messageService.pushMessage('replyFriendRequest', msgData, target);
        });
      }
    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      logger.info('[FriendService.replyFirendReqest] faild. error:', error);
      utils.invokeCallback(callback, {err: errCode}, null);
    })
    .done(function () {
      logger.info('[FriendService.replyFirendReqest] done.');
      utils.invokeCallback(callback, null, result.friend_user.toParams(userParams));
    });

};

FriendService.denyFriend = function(userId, friend_userId, callback) {
  logger.info("[FriendService.denyFriend], userId=", userId);
  logger.info("[FriendService.denyFriend], friend_userId=", friend_userId);
  var result = {};
  var userParams = {only: ['userId', 'nickName', 'gender', 'headIcon']};

  User.findOneQ({userId: friend_userId})
    .then(function (friend_user) {
      // result.user 为加好友请求发起者
      result.friend_user = friend_user;
      return MyMessabeBox.findOneQ({userId: userId});
    })
    .then(function (msg_box) {
      // 修改被请求者的加好友消息状态

      var cur_msg = null;
      for (var index=0; index<msg_box.addFriendMsgs.length; index++) {
        if (msg_box.addFriendMsgs[index].userId == friend_userId) {
          cur_msg = msg_box.addFriendMsgs[index];
          break;
        }
      }

      cur_msg.status = AddFriendStatus.DENIED;
      msg_box.markModified('addFriendMsgs');
      logger.info("FriendService.denyFriend. msg_box.addFriendMsg:", msg_box.addFriendMsg);
      return msg_box.saveQ();
    })
    .then(function () {
      return User.findOneQ({userId: userId});
    })
    .then(function (user) {
      result.user = user;
      return UserSession.findOneQ({userId: friend_userId});
    })
    .then(function (userSession) {
      logger.info("FriendService.denyFriend. push message to client, ");
      if (userSession != null) {
        var msgData = {userInfo: result.user.toParams(userParams), accept: 0};

        var target = [{uid: friend_userId, sid: userSession.frontendId}];
        // 向加好友请求者发送加友是否被同意消息
        process.nextTick(function () {
          logger.info('[FriendService.denyFriend] replyFriendReqest.msgData: ', msgData);
          logger.info('[FriendService.denyFriend] replyFriendReqest.target: ', target);
          messageService.pushMessage('replyFriendRequest', msgData, target);
        });
      }
    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      logger.info('[FriendService.denyFriend] faild. error:', error);
      utils.invokeCallback(callback, {err: errCode}, null);
    })
    .done(function () {
      logger.info('[FriendService.denyFriend] done.');
      utils.invokeCallback(callback, null, result.friend_user.toParams(userParams));
    });

};

FriendService.confirmAddFriend = function (userId, friend_userId, accept, callback) {
  logger.info("[FriendService.confirmAddFriend], userId=", userId);
  logger.info("[FriendService.confirmAddFriend], friend_userId=", friend_userId);
  logger.info("[FriendService.confirmAddFriend], is_yes=", accept);
  var result = {};
  User.findOneQ({userId: friend_userId})
    .then(function (user) {
      // result.user 为加好友请求发起者
      result.user = user;
      return MyMessabeBox.findOneQ({userId: userId});
    })
    .then(function (msg_box) {
      // 修改被请求者的加好友消息状态
      var cur_msg = msg_box.addFriendMsgs[0];
      msg_box.addFriendMsgs.forEach(function (msg) {
        if (msg.userId == friend_userId) {
          cur_msg = msg;
        }
      });
      cur_msg.status = accept ? 2 : 3;
      msg_box.markModified('addFriendMsgs');
      logger.info("FriendService.confirmAddFriend. msg_box.addFriendMsg:", msg_box.addFriendMsg);
      msg_box.save();

      if (accept) {
        return User.findOneQ({userId: userId})
      }
      else {
        return null;
      }

    })
    .then(function (friend_user) {
      if (accept) {
        // result.friend_user 是被请求为好友的玩家
        result.friend_user = friend_user;
        return MyFriend.findOneQ({userId: friend_userId});
      }
      else {
        return null;
      }

    })
    .then(function (my_friend) {
      if (accept) {
        // result.my_friend 为加好友请求发起者的好友列表对象
        if (my_friend == null) {
          my_friend = new MyFriend();
          my_friend.friends = [];
          my_friend.user_id = result.user.id;
          my_friend.userId = result.user.userId;

        }
        result.my_friend = my_friend;
        return MyFriend.findOneQ({userId: userId});
      }
      else {
        return null;
      }
    })
    .then(function (my_friend) {
      if (accept) {
        // result.friend_user_friend 为被请求者的好友列表对象
        if (my_friend == null) {
          my_friend = new MyFriend();
          my_friend.friends = [];
          my_friend.user_id = result.friend_user.id;
          my_friend.userId = result.friend_user.userId;
        }
        result.friend_user_friend = my_friend;

        // 将被请求者加入请求者的好友列表
        result.my_friend.friends.push({
          userId: result.friend_user.userId, nickName: result.friend_user.nickName,
          headIcon: result.friend_user.headIcon, gender: result.friend_user.gender, addDate: Date.now()
        });
        result.my_friend.markModified('friends');
        result.my_friend.save();
        // 将请求者加入被请求者的好友列表
        result.friend_user_friend.friends.push({
          userId: result.user.userId, nickName: result.user.nickName,
          headIcon: result.user.headIcon, gender: result.user.gender, addDate: Date.now()
        });
        result.friend_user_friend.markModified('friends');
        result.friend_user_friend.save();
      }
      return UserSession.findOneQ({userId: friend_userId});
    })
    .then(function (userSession) {
      logger.info("FriendService.confirmAddFriend. push message to client, ");
      if (userSession != null) {
        var msgData = {userId: result.friend_user.userId, nickName: result.friend_user.nickName, accept: accept};
        var target = [{uid: result.user.userId, sid: userSession.frontendId}];
        // 向加好友请求者发送加友是否被同意消息
        process.nextTick(function () {
          logger.info('[FriendService.confirmAddFriend] replyFirendReqest.msgData: ', msgData);
          logger.info('[FriendService.confirmAddFriend] replyFirendReqest.target: ', target);
          messageService.pushMessage('replyFirendReqest', msgData, target);
        });
      }

    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      logger.info('[FriendService.replyFirendReqest] faild. error:', error);
      utils.invokeCallback(callback, {err: errCode}, null);
    })
    .done(function () {
      logger.info('[FriendService.replyFirendReqest] done.');
      utils.invokeCallback(callback, null, true);
    });
};


