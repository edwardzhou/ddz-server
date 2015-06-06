/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var MyPlayedFriend = require('../../../domain/myPlayedFriend');
var MyMessageBox = require('../../../domain/myMessageBox');
var consts = require('../../../consts/consts');
var MsgType = consts.MsgType;
var MsgStatus = consts.MsgStatus;
var AddFriendStatus = consts.AddFriendStatus;

var ErrorCode = require('../../../consts/errorCode');
var Q = require('q');
var date = require("date-extended");

var friendService = require('../../../services/friendService');
var addFriendQ = Q.nbind(friendService.addFriend, friendService);
var acceptAddFriendQ = Q.nbind(friendService.acceptFriend, friendService);
var denyAddFriendQ = Q.nbind(friendService.denyFriend, friendService);

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.FriendshipHandler created.");
  this.app = app;
};

Handler.prototype.getPlayWithMeUsers = function (msg, session, next) {
  var userId = session.uid;
  logger.info('FriendshipHandler.getPlayWithMeUsers, userId: ', userId);
  MyPlayedFriend.findOneQ({userId:userId})
    .then(function(myPlayedFriend){
      var return_result = [];
      logger.info('FriendshipHandler.getPlayWithMeUsers, play_with_me_users=', myPlayedFriend);
      if (myPlayedFriend != null) {
        return_result =  myPlayedFriend.playedUsers.slice(0, 20);
      }
      logger.info('FriendshipHandler.getPlayWithMeUsers done.');
      logger.info('FriendshipHandler.getPlayWithMeUsers done. return_result:',return_result);
      utils.invokeCallback(next, null, {result: true, users: return_result});
    })
    .fail(function(error){
      logger.error('FriendshipHandler.getPlayWithMeUsers failed.', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    });
};

Handler.prototype.getFriends = function (msg, session, next) {
  var userId = session.uid;
  logger.info('FriendshipHandler.getFriends, userId: ', userId);
  MyPlayedFriend.findOneQ({userId:userId})
    .then(function(myPlayedFriend){
      var return_result = [];
      logger.info('FriendshipHandler.getFriends, friends=', myPlayedFriend);
      if (myPlayedFriend != null) {
        return_result = myPlayedFriend.friends;
      }
      logger.info('FriendshipHandler.getFriends done.');
      utils.invokeCallback(next, null, {result: true, users: return_result});
    })
    .fail(function(error){
      logger.error('FriendshipHandler.getFriends failed.', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    });
};


Handler.prototype.addFriend = function (msg, session, next) {
  var userId = session.uid;
  var friend_userId = msg.friend_userId;
  var friend_msg = msg.friend_msg;
  addFriendQ(userId, friend_userId, friend_msg)
    .then(function(result){
      utils.invokeCallback(next, null, result);
    })
    .fail(function(error){
      utils.invokeCallback(next, null, {result: false, err: error});
    });

};

Handler.prototype.confirmAddFriend = function(msg, session, next) {
  var userId = session.uid;
  var friend_userId = msg.friend_userId;
  var msgId = msg.msgId;
  var accept = msg.accept;
  var confirmFuncQ = acceptAddFriendQ;
  if (!accept) {
    confirmFuncQ = denyAddFriendQ;
  }

  confirmFuncQ(userId, friend_userId, msgId)
    .then(function(){
      utils.invokeCallback(next, null, {result: true});
    })
    .fail(function(error){
      logger.error('[friendshipHandler.confirmAddFriend] error: ', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    });

};
