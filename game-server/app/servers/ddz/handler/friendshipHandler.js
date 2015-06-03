/**
 * Created by edwardzhou on 15/5/13.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var MyPlayedFriend = require('../../../domain/myPlayedFriend');
var MyMessageBox = require('../../../domain/myMessageBox');

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
  var accept = msg.accept;
  var confirmFuncQ = acceptAddFriendQ;
  if (!accept) {
    confirmFuncQ = denyAddFriendQ;
  }

  confirmFuncQ(userId, friend_userId)
    .then(function(){
      utils.invokeCallback(next, null, {result: true});
    })
    .fail(function(error){
      logger.error('[friendshipHandler.confirmAddFriend] error: ', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    });

};

Handler.prototype.getMyMessageBoxes = function(msg, session, next){
  var userId = session.uid;
  var return_msg_box = {addFriendMsgs: []};
  var weekAgo = date.daysAgo(7);

  User.findOneQ({userId: userId})
    .then(function(user) {
      return MyMessageBox.findByUserQ(user);
    })
    .then(function(msg_box){
      //return_msg_box.addFriendMsgs = [];
      var addFriendMsgs = msg_box.addFriendMsgs.filter(function(msg) {
        return msg.status == 0;
      });
      var chatMsgs = msg_box.chatMsgs.filter(function(msg) {
        return msg.status == 0;
      });
      return_msg_box.addFriendMsgs = addFriendMsgs;
      return_msg_box.chatMsgs = chatMsgs;
      //return_msg_box.addFriendMsgs.sort(function(a,b) { return b.date - a.date;});
      //return_msg_box.chatMsgs.sort(function(a,b) { return b.date - a.date;});
    })
    .then(function(){
      utils.invokeCallback(next, null, {result: true, myMsgBox: return_msg_box});
    })
    .fail(function(error){
      logger.error('[friendshipHandler.getMyMessageBoxes] error: ', error);
      utils.invokeCallback(next, null, {err: error, result: false});
    })
};

Handler.prototype.ackChatMsg = function(msg, session, next){
  var userId = session.uid;
  var msgId = msg.msgId;

  User.findOneQ({userId: userId})
    .then(function(user) {
      return MyMessageBox.findByUserQ(user);
    })
    .then(function(msg_box){
      for (var index=msg_box.chatMsgs.length-1; index>=0; index--) {
        var chatMsg = msg_box.chatMsgs[index];
        if (chatMsg.msgId == msgId) {
          chatMsg.status = 1;
          msg_box.markModified('chatMsgs');
          msg_box.saveQ();
          break;
        }
      }
    })
    .then(function(){
      utils.invokeCallback(next, null, {result: true});
    })
    .fail(function(error){
      logger.error('[friendshipHandler.ackChatMsg] error: ', error);
      utils.invokeCallback(next, null, {err: error, result: false});
    })
};
