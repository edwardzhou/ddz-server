/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var UserSession = require('../../../domain/userSession');
var messageService = require('../../../services/messageService');
var MyMessageBox = require('../../../domain/myMessageBox');

var userService = require('../../../services/userService');
var consts = require('../../../consts/consts');
var MsgType = consts.MsgType;
var MsgStatus = consts.MsgStatus;
var AddFriendStatus = consts.AddFriendStatus;


module.exports = function (app) {
  return new Handler(app);
};

var Handler = function (app) {
  logger.info("connector.MessageHandler created.");
  this.app = app;
};


/**
 * 发送打牌中的聊天信息
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.getMyMessageBox = function (msg, session, next) {
  var userId = session.uid;
  var msgStatus = msg.msgStatus || MsgStatus.NEW;
  var msgType = msg.msgType || MsgType.ALL_MSG;

  var query = MyMessageBox.find({userId: userId});
  if (msgType != MsgType.ALL_MSG) {
    query.where('msgType').equals(msgType);
  }
  if (msgStatus >= 0) {
    query.where('msgStatus').equals(msgStatus);
  }

  query.sort({updated_at: 1})
    .execQ()
    .then(function(msgs) {
      utils.invokeCallback(next, null, {result: true, myMsgBox: msgs.toParams()});
    })
    .fail(function(error){
      logger.error('[messageHandler.getMyMessageBox] error => ', error);
      utils.invokeCallback(next, null, {err: error, result: false});
    });

};

Handler.prototype.ackMessage = function (msg, session, next) {
  var userId = session.uid;
  var msgId = msg.msgId;
  var query = MyMessageBox.findOne({_id: msgId});
  query.execQ()
    .then(function(msgItem) {
      if (!!msgItem && msgItem.msgStatus == MsgStatus.NEW) {
        msgItem.msgStatus = MsgStatus.DELIVERED;
        msgItem.saveQ();
      }
      utils.invokeCallback(next, null, {result: true});
    })
    .fail(function(error){
      logger.error('[messageHandler.ackMessage] error => ', error);
      utils.invokeCallback(next, null, {err: error, result: false});
    });
};




