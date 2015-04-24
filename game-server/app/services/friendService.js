/**
 * Created by jeffcao on 15/4/8.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var Users = require('../domain/user');
var Player = require('../domain/player');
var MyPlayed = require('../domain/myPlayed');
var utils = require('../util/utils');

var FriendService = module.exports;


FriendService.init = function(app) {
    logger.info("FriendService init.");
    pomeloApp = app;

};

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