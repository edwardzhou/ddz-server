/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var AppointPlay = require('../../../domain/appointPlay');
var MyPlayedFriend = require('../../../domain/myPlayedFriend');
var MyMessageBox = require('../../../domain/myMessageBox');

var ErrorCode = require('../../../consts/errorCode');
var Q = require('q');

//var friendService = require('../../../services/friendService');
var notificationService = require('../../../services/notificationService');
//var addFriendQ = Q.nbind(friendService.addFriend, friendService);
//var acceptAddFriendQ = Q.nbind(friendService.acceptFriend, friendService);
//var denyAddFriendQ = Q.nbind(friendService.denyFriend, friendService);

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.AppointPlayHandler created.");
  this.app = app;
};

var userIdCompareFunc = function(a,b) {
  return a - b;
};

var createNewAppointPlayQ = function(results, userId, player1_userId, player2_userId) {
  return User.findOneQ({userId: userId})
    .then(function(user) {
      results.creator = user;
      return User.findQ({userId: {$in: [player1_userId, player2_userId]}});
    })
    .then(function(users) {
      results.player1 = users[0];
      results.player2 = users[1];

      return AppointPlay.createAppointPlayQ(results.creator, [results.creator, results.player1, results.player2]);
    });
};


Handler.prototype.createAppointPlay = function (msg, session, next) {
  var userId = session.uid;
  var player1_userId = msg.player1_userId;
  var player2_userId = msg.player2_userId;
  var orgIds = [userId, player1_userId, player2_userId].sort(userIdCompareFunc);

  var results = {};
  logger.info('AppointPlayHandler.createAppointPlay, userId: ', userId);

  AppointPlay.findQ({'players.userId': userId})
    .then(function(plays) {
      var existPlay = null;
      if (!!plays && plays.length>0) {
        for (var index=0; index<plays.length; index++) {
          var playerIds = plays[index].players.map(function(p) {return p.userId;}).sort(userIdCompareFunc);
          if (Array.isSameContents(orgIds, playerIds)) {
            existPlay = plays[index];
            break;
          }
        }
      }

      if (!!existPlay) {
        return existPlay;
      } else {
        return createNewAppointPlayQ(results, userId, player1_userId, player2_userId);
      }
    })
    .then(function(newAppointPlay) {
      utils.invokeCallback(next, null, {result:true, appointPlay: newAppointPlay.toParams()});
      notificationService.pushAppointPlayNotification(newAppointPlay, userId);
    })
    .fail(function(error) {
      logger.error('AppointPlayHandler.createAppointPlay failed.', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    });
};

Handler.prototype.getAppointPlays = function(msg, session, next) {
  var userId = session.uid;

  AppointPlay.findQ({'players.userId': userId})
    .then(function(appointPlays) {
      var msgBack = {
        result: true,
        appointPlays: appointPlays.toParams()
      };
      utils.invokeCallback(next, null, msgBack);
    })
    .fail(function(err) {
      utils.invokeCallback(next, null, {result: false, err: err});
    });
};