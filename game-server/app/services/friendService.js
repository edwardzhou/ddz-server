/**
 * Created by jeffcao on 15/4/8.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var Users = require('../domain/user');
var Player = require('../domain/player');
var PlayWithMeUser = require('../domain/playWithMeUser');
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
            for(var j=0;j<friend_players.length;j++) {
                FriendService.doUpdatePlayWithMePlayer(me_player, friend_players[j]);
            }
        }
    }
};

FriendService.doUpdatePlayWithMePlayer = function(me_player, friend_player){
    logger.info("[FriendService.doUpdatePlayWithMePlayer], friend_player=", friend_player);
    PlayWithMeUser.findOneQ({me_userId: me_player.userId, userId: friend_player.userId})
        .then(function (play_whith_player) {
            if (play_whith_player == null) {
                var new_play_whith_player = new PlayWithMeUser();
                new_play_whith_player.me_userId = me_player.userId;
                new_play_whith_player.userId = friend_player.userId;
                new_play_whith_player.user_id = friend_player.id;
                new_play_whith_player.nickName = friend_player.nickName;
                new_play_whith_player.play_count = 1;
                new_play_whith_player.last_play_time = Date.now();
                new_play_whith_player.save();
                logger.info("[FriendService.doUpdatePlayWithMePlayer], new_play_whith_player:", new_play_whith_player);
            }
            else {
                play_whith_player.play_count = play_whith_player.play_count + 1;
                play_whith_player.save();
                logger.info("[FriendService.doUpdatePlayWithMePlayer], play_whith_player:", play_whith_player);
            }

        });
};