/**
 * Created by jeffcao on 15/4/8.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var User = require('../domain/user');
var Player = require('../domain/player');
var MyPlayedFriend = require('../domain/myPlayedFriend');
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

FriendService.doUpdatePlayWithMePlayer = function (self_player, friend_players) {
  logger.info("[FriendService.doUpdatePlayWithMePlayer], friend_players=", friend_players);
  var userParams = {only: ['userId', 'nickName', 'gender', 'headIcon']};

  MyPlayedFriend.findOneQ({userId: self_player.userId})
    .then(function (myPlayedFriend) {
      if (myPlayedFriend == null) {
        myPlayedFriend = new MyPlayedFriend();
        myPlayedFriend.user_id = self_player.id;
        myPlayedFriend.userId = self_player.userId;
        myPlayedFriend.playedUsers = [];
        myPlayedFriend.friends = [];
      }

      var myPlayed = null;
      var myFriend = null;
      for (var j = 0; j < friend_players.length; j++) {
        myPlayed = myPlayedFriend.findPlayedUser(friend_players[j].userId);
        myFriend = myPlayedFriend.findFriend(friend_players[j].userId);
        if (!!myPlayed) {
          myPlayed.lastPlayed = Date.now();
        } else {
          myPlayed = friend_players[j].toParams(userParams);
          myPlayed.lastPlayed = Date.now();
          myPlayed.isFriend = !!myFriend;
          myPlayedFriend.playedUsers.push(myPlayed);
        }
      }

      myPlayedFriend.sortPlayedUsers();

      return myPlayedFriend.saveQ();
    })
    .then(function(myPlayedFriend) {
      logger.info("[FriendService.doUpdatePlayWithMePlayer], new_play_whit_player:", myPlayedFriend);
    })
    .fail(function (err) {
      logger.error('[FriendService.doUpdatePlayWithMePlayer] error: ', err);
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
      result.userInfo = result.user.toParams({only: ['userId', 'nickName', 'gender', 'headIcon']});
      return MyPlayedFriend.findOneQ({userId: userId});
    })
    .then(function (myPlayedFriend) {
      if (!!myPlayedFriend && !!myPlayedFriend.findFriend(friend_userId)) {
        throw genError("already is friend");
      }
      return User.findOneQ({userId: friend_userId});
    })
    .then(function (friend_user) {
      result.friend_user = friend_user;
      return MyMessabeBox.findOneQ({userId: friend_userId});
    })
    .then(function (friendMsgBox) {
      if (friendMsgBox == null) {
        logger.info("FriendService.addFriend. new MyMessageBox");
        friendMsgBox = new MyMessabeBox();
        friendMsgBox.user_id = result.friend_user.id;
        friendMsgBox.userId = result.friend_user.userId;
      }

      var msg = friendMsgBox.findFromArray(friendMsgBox.addFriendMsgs, 'userId', userId);
      if (!!msg) {
        msg.status = AddFriendStatus.NEW;
        msg.date = Date.now();
      } else {
        friendMsgBox.addFriendMsgs.push({
          userId: userId,
          userInfo: result.userInfo,
          msg: friend_msg,
          status: AddFriendStatus.NEW,
          date: Date.now()
        });
      }

      logger.info("FriendService.addFriend. msg_box.addFriendMsg:", friendMsgBox.addFriendMsg);
      friendMsgBox.markModified('addFriendMsgs');
      friendMsgBox.save();

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

FriendService.acceptFriend = function (userId, friend_userId, callback) {
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

      var cur_msg = msg_box.findFromArray(msg_box.addFriendMsgs, 'userId', friend_userId);
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

      return MyPlayedFriend.findOneQ({userId: userId});
    })
    .then(function (selfPlayedFriend) {
      if (selfPlayedFriend == null) {
        selfPlayedFriend = new MyFriend();
        selfPlayedFriend.user_id = result.user.id;
        selfPlayedFriend.userId = result.user.userId;
      }

      result.selfPlayedFriend = selfPlayedFriend;
      var friendship = selfPlayedFriend.findFriend(friend_userId);
      if (!friendship) {
        var userInfo = result.friend_user.toParams(userParams);
        userInfo.addDate = Date.now();
        selfPlayedFriend.friends.push(userInfo);
      }

      selfPlayedFriend.sortFriends();

      var played = selfPlayedFriend.findPlayedUser(friend_userId);
      if (!!played) {
        played.isFriend = true;
        selfPlayedFriend.markModified('playedUsers');
        selfPlayedFriend.playedUsersTm = Date.now();
      }

      selfPlayedFriend.markModified('friends');
      selfPlayedFriend.friendsTm = Date.now();
      return selfPlayedFriend.saveQ();
    })
    .then(function () {
      return MyPlayedFriend.findOneQ({userId: friend_userId});
    })
    .then(function (friendPlayedFriend) {
      if (friendPlayedFriend == null) {
        friendPlayedFriend = new MyFriend();
        friendPlayedFriend.user_id = result.friend_user.id;
        friendPlayedFriend.userId = result.friend_user.userId;
      }

      result.friendPlayedFriend = friendPlayedFriend;
      var friendship = friendPlayedFriend.findFriend(result.user.userId);
      if (!friendship) {
        var userInfo = result.user.toParams(userParams);
        userInfo.addDate = Date.now();
        friendPlayedFriend.friends.push(userInfo);
      }

      var played = friendPlayedFriend.findPlayedUser(result.user.userId);
      if (!!played) {
        played.isFriend = true;
        friendPlayedFriend.markModified('playedUsers');
        friendPlayedFriend.playedUsersTm = Date.now();
        friendPlayedFriend.friendsTm = Date.now();
      }

      friendPlayedFriend.markModified('friends');
      return friendPlayedFriend.saveQ();
    })
    .then(function () {
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
      logger.info('[FriendService.replyFriendRequest] failed. error:', error);
      utils.invokeCallback(callback, {err: errCode}, null);
    })
    .done(function () {
      logger.info('[FriendService.replyFriendRequest] done.');
      utils.invokeCallback(callback, null, result.friend_user.toParams(userParams));
    });

};

FriendService.denyFriend = function (userId, friend_userId, callback) {
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

      var cur_msg = msg_box.findFromArray(msg_box.addFriendMsgs, 'userId', friend_userId);
      //for (var index=0; index<msg_box.addFriendMsgs.length; index++) {
      //  if (msg_box.addFriendMsgs[index].userId == friend_userId) {
      //    cur_msg = msg_box.addFriendMsgs[index];
      //    break;
      //  }
      //}

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
          logger.info('[FriendService.denyFriend] replyFriendRequest.msgData: ', msgData);
          logger.info('[FriendService.denyFriend] replyFriendRequest.target: ', target);
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
