/**
 * Created by jeffcao on 15/4/8.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var Users = require('../domain/user');
var Player = require('../domain/player');
var MyPlayed = require('../domain/myPlayed');
var MyFriend = require('../domain/myFriend');
var MyMessabeBox = require('../domain/myMessageBox');
var messageService = require('./messageService');
var UserSession = require('../domain/userSession');

var utils = require('../util/utils');

var FriendService = module.exports;


FriendService.init = function(app) {
    logger.info("FriendService init.");
    pomeloApp = app;

};

/**
 * 更新或增加打过牌的玩家信息
 * @param players
 * @param play_results
 */

FriendService.updatePlayWithMeUsers = function(players, play_results) {
    logger.info("[FriendService.updatePlayWithMeUsers]");
    logger.info("[FriendService.updatePlayWithMeUsers], players.length=", players.length);
    for (var i=0;i<players.length;i++) {
        if (!players[i].robot) {
            var me_player = players[i];
            logger.info("[FriendService.updatePlayWithMeUsers], me_player=", me_player);
            var friend_players = [];
            if (i == 0) { friend_players = [players[1], players[2]]; }
            if (i == 1) { friend_players = [players[0], players[2]]; }
            if (i == 2) { friend_players = [players[0], players[1]]; }
            logger.info("[FriendService.updatePlayWithMeUsers], friend_players.length=", friend_players.length);
            //for(var j=0;j<friend_players.length;j++) {
            //
            //}
            FriendService.doUpdatePlayWithMePlayer(me_player, friend_players);
        }
    }
};

FriendService.doUpdatePlayWithMePlayer = function(me_player, friend_players){
    logger.info("[FriendService.doUpdatePlayWithMePlayer], friend_players=", friend_players);
    MyPlayed.findOneQ({userId: me_player.userId})
        .then(function (played_user) {
            if (played_user == null) {
                var new_played_user = new MyPlayed();
                new_played_user.user_id = me_player.id;
                new_played_user.userId = me_player.userId;
                new_played_user.playedUsers = [];
                for(var j=0;j<friend_players.length;j++) {
                    new_played_user.playedUsers.push({userId: friend_players[j].userId, nickName: friend_players[j].nickName,
                        headIcon: friend_players[j].headIcon, gender: friend_players.gender, lastPlayed: Date.now(),
                        gameStat: {won:0, lose: 0 }});
                }

                new_played_user.save();
                logger.info("[FriendService.doUpdatePlayWithMePlayer], new_play_whith_player:", new_played_user);
            }
            else {

                for(var j=0;j<friend_players.length;j++) {
                    var is_new_played = true;
                    var friend_player = friend_players[j];
                    for(var i=0;i<played_user.playedUsers.length;i++){
                        if (played_user.playedUsers[i].userId == friend_player.userId){
                            played_user.playedUsers[i].lastPlayed = Date.now();
                            is_new_played = false;
                        }
                    }
                    if (is_new_played){
                        played_user.playedUsers.push({userId: friend_player.userId, nickName: friend_player.nickName,
                            headIcon: friend_player.headIcon, gender: friend_player.gender, lastPlayed: Date.now()});
                    }
                }
                played_user.markModified('playedUsers');
                played_user.save();
                logger.info("[FriendService.doUpdatePlayWithMePlayer], play_whith_player:", played_user);
            }

        });
};

FriendService.addFriend = function (userId, friend_userId, friend_msg, callback){
    logger.info("[FriendService.addFriend], userId=", userId);
    logger.info("[FriendService.addFriend], friend_msg=", friend_msg);
    logger.info("[FriendService.addFriend], friend_userId=", friend_userId);
    var result;
    Users.findOneQ({userId: userId})
        .then(function(user){
            result.user = user;
            return MyMessabeBox.findOneQ({userId: userId});
        })
        .then(function(msg_box){
            if (msg_box == null){
                logger.info("FriendService.addFriend. new MyMessageBox");
                msg_box = new MyMessabeBox();
                msg_box.user_id = result.user.id;
                msg_box.userId = result.user.userId;
                msg_box.addFriendMsgs = [];
            }
            msg_box.addFriendMsgs.push({userId: friend_userId, msg: friend_msg, date: Date.now()});
            logger.info("FriendService.addFriend. msg_box.addFriendMsg:", msg_box.addFriendMsg);
            msg_box.markModified('addFriendMsgs');
            msg_box.save();

            return UserSession.findOneQ({userId: userId});
        })
        .then(function(userSession){
            logger.info("FriendService.addFriend. push message to client");
            var msgData = {userId: result.user.userId, nickName: result.user.nickName, msg: friend_msg};
            var target = [{uid: result.user.userId, sid: userSession.frontendId}];

            process.nextTick(function() {
                logger.info('[FriendService.addFriend] addFirendReqest.msgData: ', msgData);
                logger.info('[FriendService.addFriend] addFirendReqest.target: ', target);
              messageService.pushMessage('addFirendReqest',msgData ,target);
            });
        })
        .fail(function(error){
            var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
            utils.invokeCallback(callback, {err: errCode}, null);
        })
        .done(function(){
            utils.invokeCallback(callback, null, true);
        });
};

FirendService.replyAddFriendMsg = function (userId, friend_userId, is_yes){
    logger.info("[FriendService.replyAddFriendMsg], userId=", userId);
    logger.info("[FriendService.replyAddFriendMsg], friend_msg=", friend_msg);
    logger.info("[FriendService.replyAddFriendMsg], is_yes=", is_yes);
    var result;
    Users.findOneQ({userId: friend_userId})
        .then(function(user){
            result.user = user;
            return MyMessabeBox.findOneQ({userId: friend_userId});
        })
        .then(function(msg_box){
            var del_msg = msg_box.addFriendMsgs[0];
            msg_box.addFriendMsgs.forEach(function(msg){
                if (msg.userId == userId) {del_msg = msg;}
            });
            msg_box.addFriendMsgs.splice(msg_box.addFriendMsgs.indexOf(del_msg));
            msg_box.markModified('addFriendMsgs');
            logger.info("FriendService.replyAddFriendMsg. msg_box.addFriendMsg:", msg_box.addFriendMsg);
            msg_box.save();

            if (is_yes) {
                return Users.findOneQ({userId: userId})
            }
            else {return null;}

        })
        .then(function(friend_user){
            if (is_yes){
                result.friend_user = friend_user;
                return MyFriend.findOneQ({userId: friend_userId});
            }
            else {return null;}

        })
        .then(function(my_friend){
            if (is_yes){
                result.my_friend = my_friend;
                return MyFriend.findOneQ({userId: userId});
            }
            else {return null;}
        })
        .then(function(my_friend){
            if (is_yes){
                result.friend_user_friend = my_friend;

                result.my_friend.friends.push({userId: result.friend_user.userId, nickName: result.friend_user.nickName,
                    headIcon: result.friend_user.headIcon, gender: result.friend_user.gender, addDate: Date.now()});
                result.my_friend.markModified('friends');
                result.my_friend.save();

                result.friend_user_friend.friends.push({userId: result.user.userId, nickName: result.user.nickName,
                    headIcon: result.user.headIcon, gender: result.user.gender, addDate: Date.now()});
                result.friend_user_friend.markModified('friends');
                result.friend_user_friend.save();
            }
            return UserSession.findOneQ({userId: friend_userId});
        })
        .then(function(userSession){
            logger.info("FriendService.replyAddFriendMsg. push message to client");

            var msgData = {userId: result.friend_user.userId, nickName: result.friend_user.nickName, is_yes: is_yes};
            var target = [{uid: result.user.userId, sid: userSession.frontendId}];

            process.nextTick(function() {
                logger.info('[FriendService.replyAddFriendMsg] replyFirendReqest.msgData: ', msgData);
                logger.info('[FriendService.replyAddFriendMsg] replyFirendReqest.target: ', target);
                messageService.pushMessage('replyFirendReqest',msgData ,target);
            });
        })
        .fail(function(error){
            var errCode = error.errCode || ErrorCode.SYSTEM_ERROR;
            utils.invokeCallback(callback, {err: errCode}, null);
        })
        .done(function(){
            utils.invokeCallback(callback, null, true);
        });
};


