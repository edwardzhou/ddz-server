/**
 * Created by edwardzhou on 15/4/24.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var MyMessageBox = require('../../../domain/myMessageBox');
var UserSession = require('../../../domain/userSession');
var messageService = require('../../../services/messageService');
var notificationService = require('../../../services/notificationService');

var userService = require('../../../services/userService');


module.exports = function (app) {
  return new Handler(app);
};

var Handler = function (app) {
  logger.info("connector.TaskHandler created.");
  this.app = app;
};


/**
 * 发送打牌中的聊天信息
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.sendGamingChatText = function (msg, session, next) {
  var userId = session.uid;

  var results = {};

  var chatMsg = {
    from: userId,
    nickName: '',
    type: 1, //'1 - text message'
    message: msg.chatText,
    to: msg.to
  };

  User.findOneQ({userId: userId})
    .then(function(user) {
      results.user = user;
      chatMsg.nickName = user.nickName;
      return UserSession.findQ({userId: {$in: msg.to}});
    })
    .then(function(uSessions) {
      var uids = uSessions.map(function(s) { return {sid: s.frontendId, uid: s.userId}; });
      messageService.pushMessage('onGamingChatText', chatMsg, uids);
      utils.invokeCallback(next, null, {});
    })
    .fail(function(err) {
      utils.invokeCallback(next, {err: err}, null);
    });
};

Handler.prototype.sendChatMsg = function(msg, session, next) {
  var userId = session.uid;
  var receiverId = msg.toUserId;
  var chatText = msg.chatText;
  var results = {};

  MyMessageBox.newChatMsgQ(userId, receiverId, chatText)
    .then(function(msgItem) {
      return notificationService.tryPushNotificationQ(receiverId, 'onChatMsg', msgItem.toParams());
    })
    .then(function() {
      utils.invokeCallback(next, null, {result: true});
    })
    .fail(function(err) {
      logger.error('[chatHandler.sendChatMsg] error: ', err);
      utils.invokeCallback(next, null, {result: false, error: err});
    });
};