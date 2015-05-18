/**
 * Created by edwardzhou on 15/5/18.
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

var friendService = require('../../../services/friendService');
var addFriendQ = Q.nbind(friendService.addFriend, friendService);
var acceptAddFriendQ = Q.nbind(friendService.acceptFriend, friendService);
var denyAddFriendQ = Q.nbind(friendService.denyFriend, friendService);

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  logger.info("connector.AppointPlayHandler created.");
  this.app = app;
};

Handler.prototype.createAppointPlay = function (msg, session, next) {
  var userId = session.uid;
  var player1_userId = msg.player1_userId;
  var player2_userId = msg.player2_userId;

  var results = {};
  logger.info('AppointPlayHandler.createAppointPlay, userId: ', userId);

  User.findOneQ({userId: userId})
    .then(function(user) {
      results.creator = user;
      return User.findQ({userId: {$in: [player1_userId, player2_userId]}});
    })
    .then(function(users) {
      results.player1 = users[0];
      results.player2 = users[1];

      return AppointPlay.createAppointPlayQ(results.creator, [results.creator, results.player1, results.player2])
    })
    .then(function(newAppointPlay) {
      utils.invokeCallback(next, null, {result:true, appointPlay: newAppointPlay.toParams()});
    })
    .fail(function(error) {
      logger.error('AppointPlayHandler.createAppointPlay failed.', error);
      utils.invokeCallback(next, null, {result: false, err: error});
    });
};
