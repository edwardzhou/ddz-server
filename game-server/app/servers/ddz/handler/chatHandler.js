/**
 * Created by edwardzhou on 15/4/24.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var UserSession = require('../../../domain/userSession');
var messageService = require('../../../services/messageService');

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

