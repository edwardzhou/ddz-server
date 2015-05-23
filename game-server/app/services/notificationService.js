/**
 * Created by edwardzhou on 15/5/20.
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

var utils = require('../util/utils');
var Q = require('q');

var NotificationService = module.exports;
var pomeloApp = null;

var genError = function (errCode) {
  var error = new Error();
  error.errCode = errCode;
  return error;
};

NotificationService.init = function (app) {
  logger.info("NotificationService init.");
  pomeloApp = app;

};

/**
 * 更新或增加打过牌的玩家信息
 * @param players
 * @param play_results
 */

NotificationService.pushNotification = function (userId, msgType, msgBody, pushBackRouter, pushBackData, cb) {
  var results = {};

  Q.fcall(function() {
    if (!!userId.userId && !!userId.id) {
      return userId;
    }

    return User.findOneQ({userId: userId});
  })
    .then(function(user) {
      results.user = user;

      return MyMessabeBox.findOneQ({userId: user.userId});
    })
    .then(function(myMsgBox) {
      if (!myMsgBox) {
        myMsgBox = new MyMessabeBox();
        myMsgBox.user_id = results.user.id;
        myMsgBox.userId = results.user.userId;
      }

      results.myMsgBox = myMsgBox;

      myMsgBox[msgType].push(msgBody);

      return myMsgBox.saveQ();
    })
    .then(function() {
      return UserSession.findOneQ({userId: userId});
    })
    .then(function(userSession) {
      if (!!userSession) {
        var target = [{uid: result.user.userId, sid: userSession.frontendId}];

        process.nextTick(function () {
          logger.info('[NotificationService.pushNotification] %s: ', pushBackRouter, pushBackData);
          messageService.pushMessage(pushBackRouter, pushBackData, target);
        });
      }
    })
    .then(function() {
      utils.invokeCallback(cb, null, results);
    })
    .fail(function(err) {
      logger.error('[NotificationService.pushNotification] Error: ', err);
      utils.invokeCallback(cb, err, results);
    })
};

NotificationService.pushAppointPlayNotification = function(appointPlay, requestUserId) {
  var requester = null;

  appointPlay.players.forEach(function(player) {
    if (player.userId == requestUserId) {
      requester = player;
      return false; // break loop
    }

    return true;
  });

  appointPlay.players.forEach(function(player) {
    if (player.userId == requestUserId) {
      return true; // next loop
    }

    UserSession.findOneQ({userId: player.userId})
      .then(function(userSession) {
        if (!!userSession) {
          var msgData = {
            requestPlayer: Player.toParams(requester, {only: ['userId', 'nickName']}),
            appointPlay: appointPlay.toParams()
          };

          process.nextTick(function () {
            messageService.pushMessage('onAppointPlayRequest', msgData, [{
              uid: userSession.userId,
              sid: userSession.frontendId
            }]);
          });
        }
      })
      .fail(function(err) {
        logger.error('[NotificationService.pushAppointPlayNotification] Error: ', err);
      });
  });
};

