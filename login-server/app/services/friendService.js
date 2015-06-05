/**
 * Created by jeffcao on 15/4/8.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var User = require('../domain/user');
var Player = require('../domain/player');
var MyPlayedFriend = require('../domain/myPlayedFriend');
var Result = require('../domain/result');
var MyMessageBox = require('../domain/myMessageBox');
var messageService = require('./messageService');
var notificationService = require('./notificationService');
var UserSession = require('../domain/userSession');
var ErrorCode = require('../consts/errorCode');
var AddFriendStatus = require('../consts/consts').AddFriendStatus;
var consts = require('../consts/consts');
var MsgType = consts.MsgType;
var MsgStatus = consts.MsgStatus;

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
      for (var index = 0; index < friend_players.length; index++) {
        myPlayed = myPlayedFriend.findPlayedUser(friend_players[index].userId);
        myFriend = myPlayedFriend.findFriend(friend_players[index].userId);
        if (!!myPlayed) {
          myPlayed.lastPlayed = Date.now();
        } else {
          myPlayed = friend_players[index].toParams(userParams);
          myPlayed.lastPlayed = Date.now();
          myPlayedFriend.playedUsers.push(myPlayed);
        }
        myPlayed.isFriend = !!myFriend;
        if (!!myFriend) {
          myFriend.lastPlayed = myPlayed.lastPlayed;
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
  var results = {};
  User.findOneQ({userId: userId})
    .then(function (user) {
      results.user = user;
      results.userInfo = results.user.toParams({only: ['userId', 'nickName', 'gender', 'headIcon']});
      return MyPlayedFriend.findOneQ({userId: userId});
    })
    .then(function (myPlayedFriend) {
      if (!!myPlayedFriend && !!myPlayedFriend.findFriend(friend_userId)) {
        throw genError("already is friend");
      }
      return User.findOneQ({userId: friend_userId});
    })
    .then(function (friend_user) {
      results.friend_user = friend_user;
      return MyMessageBox.newAddFriendMsgQ(friend_userId, results.user);
    })
    .then(function (msgItem) {
      results.addFriendMsg = msgItem;

      var msgData = msgItem.toParams();
      notificationService.tryPushNotification(friend_userId, 'addFriendRequest', msgData);
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

FriendService.acceptFriend = function (userId, friend_userId, msgId, callback) {
  logger.info("[FriendService.acceptFriend], userId=", userId);
  logger.info("[FriendService.acceptFriend], friend_userId=", friend_userId);
  var results = {};
  var userParams = {only: ['userId', 'nickName', 'gender', 'headIcon']};

  // 取message
  MyMessageBox.findOneQ({_id: msgId})
    .then(function(msgItem) {
      // msgItem 可能为空, 过期失效被系统删除.
      if (msgItem == null) {
        var error = Result.genErrorResult(ErrorCode.DATA_NOT_FOUND, 0, '该好友请求已失效!');
        throw error;
      }

      // msgItem 不是该两用户的
      if (msgItem.userId != userId || msgItem.msgUserId != friend_userId) {
        throw Result.genErrorResult(ErrorCode.SYSTEM_ERROR, 0, '非法请求!');
      }

      results.msgItem = msgItem;

      // 标记已接受并保存
      msgItem.msgData.status = AddFriendStatus.ACCEPTED;
      msgItem.markModified('msgData');
      return msgItem.saveQ();
    })
    .then(function() {
      // 取自身用户
      return User.findOneQ({userId: userId});
    })
    .then(function(selfUser) {
      results.selfUser = selfUser;
      // 取好友用户
      return User.findOneQ({userId: friend_userId});
    })
    .then(function(friendUser) {
      results.friendUser = friendUser;
      // 取自身的好友关系
      return MyPlayedFriend.findOneQ({userId: userId});
    })
    .then(function(selfPlayedFriend) {
      // 如果还没有数据, 则新建
      if (selfPlayedFriend == null) {
        selfPlayedFriend = new MyPlayedFriend();
        selfPlayedFriend.user_id = results.selfUser.id;
        selfPlayedFriend.userId = results.selfUser.userId;
      }
      results.selfPlayedFriend = selfPlayedFriend;

      // 如果不是好友关系, 则添加到好友列表, 已是的不需要处理
      var friendship = selfPlayedFriend.findFriend(friend_userId);
      if (!friendship) {
        var userInfo = results.friendUser.toParams(userParams);
        userInfo.addDate = Date.now();
        selfPlayedFriend.friends.push(userInfo);
      }

      // 对好友排序
      selfPlayedFriend.sortFriends();

      // 如果是打过牌的, 对其标记为好友
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
      // 取好友的好友关系数据
      return MyPlayedFriend.findOneQ({userId: friend_userId});
    })
    .then(function(friendPlayedFriend) {
      // 如果好友还没有好友关系数据, 则新建数据
      if (friendPlayedFriend == null) {
        friendPlayedFriend = new MyFriend();
        friendPlayedFriend.user_id = results.friendUser.id;
        friendPlayedFriend.userId = results.friendUser.userId;
      }
      results.friendPlayedFriend = friendPlayedFriend;

      // 如果不是好友关系, 则添加到好友列表, 已是的不需要处理
      var friendship = friendPlayedFriend.findFriend(results.selfUser.userId);
      if (!friendship) {
        var userInfo = results.selfUser.toParams(userParams);
        userInfo.addDate = Date.now();
        friendPlayedFriend.friends.push(userInfo);
      }

      // 如果是打过牌的, 对其标记为好友
      var played = friendPlayedFriend.findPlayedUser(results.selfUser.userId);
      if (!!played) {
        played.isFriend = true;
        friendPlayedFriend.markModified('playedUsers');
        friendPlayedFriend.playedUsersTm = Date.now();
        friendPlayedFriend.friendsTm = Date.now();
      }

      friendPlayedFriend.markModified('friends');
      return friendPlayedFriend.saveQ();
    })
    .then(function() {
      // 尝试推送通知消息给在线好友
      var msgData = {userInfo: results.selfUser.toParams(userParams), accept: 1};
      notificationService.tryPushNotificationQ(friend_userId, 'replyFriendRequest', msgData);
    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      var errMsg = error.message || '系统错误';
      logger.info('[FriendService.replyFriendRequest] failed. error:', error);
      utils.invokeCallback(callback, {err: errCode, errMsg: errMsg}, null);
    })
    .done(function () {
      logger.info('[FriendService.replyFriendRequest] done.');
      utils.invokeCallback(callback, null, results.friendUser.toParams(userParams));
    });
};

FriendService.denyFriend = function (userId, friend_userId, msgId, callback) {
  logger.info("[FriendService.denyFriend], userId=", userId);
  logger.info("[FriendService.denyFriend], friend_userId=", friend_userId);
  var results = {};
  var userParams = {only: ['userId', 'nickName', 'gender', 'headIcon']};

  // 取message
  MyMessageBox.findOneQ({_id: msgId})
    .then(function(msgItem) {
      // msgItem 可能为空, 过期失效被系统删除.
      if (msgItem == null) {
        throw Result.genErrorResult(ErrorCode.DATA_NOT_FOUND, 0, '该好友请求已失效!');
      }

      // msgItem 不是该两用户的
      if (msgItem.userId != userId || msgItem.msgUserId != friend_userId) {
        throw Result.genErrorResult(ErrorCode.SYSTEM_ERROR, 0, '非法请求!');
      }

      results.msgItem = msgItem;

      // 标记已接受并保存
      msgItem.msgData.status = AddFriendStatus.DENIED;
      msgItem.markModified('msgData');
      return msgItem.saveQ();
    })
    .then(function () {
      return User.findOneQ({userId: userId});
    })
    .then(function (selfUser) {
      results.selfUser = selfUser;

      // 尝试推送通知消息给在线好友
      var msgData = {userInfo: results.selfUser.toParams(userParams), accept: 0};
      notificationService.tryPushNotificationQ(friend_userId, 'replyFriendRequest', msgData);
    })
    .fail(function (error) {
      var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
      var errMsg = error.message || '系统错误';
      logger.info('[FriendService.replyFriendRequest] failed. error:', error);
      utils.invokeCallback(callback, error, null);
    })
    .done(function () {
      logger.info('[FriendService.replyFriendRequest] done.');
      utils.invokeCallback(callback, null, {result: true});
    });

};
