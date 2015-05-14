/**
 * Created by edwardzhou on 15/5/13.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var MyPlayed = require('../../../domain/myPlayed');
var MyFriend = require('../../../domain/myFriend');
var MyMessageBox = require('../../../domain/myMessageBox');

var ErrorCode = require('../../../consts/errorCode');
var Q = require('q');

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
  MyPlayed.findOneQ({userId:userId})
    .then(function(my_played){
      var return_result = [];
      logger.info('FriendshipHandler.getPlayWithMeUsers, play_with_me_users=', my_played);
      if (my_played != null) {
        return_result =  my_played.toParams().playedUsers;
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
  MyFriend.findOneQ({userId:userId})
    .then(function(my_friend){
      var return_result = [];
      logger.info('FriendshipHandler.getFriends, friends=', my_friend);
      if (my_friend != null) {
        return_result = my_friend.toParams();
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
  MyMessageBox.findOneQ({userId: userId})
    .then(function(msg_box){
      return_msg_box.addFriendMsgs = [];
      msg_box.addFriendMsgs.forEach(function(msg){
        if (msg.status == 0){
          return_msg_box.addFriendMsgs.push(JSON.parse(JSON.stringify(msg)));
          msg.status = 1;
        }
      });
      msg_box.markModified('addFriendMsgs');
      return msg_box.saveQ();

    })
    .then(function(){
      utils.invokeCallback(next, null, {result: true, myMsgBox: return_msg_box});
    })
    .fail(function(error){
      utils.invokeCallback(next, null, {err: errCode, result: false});
    })
};
