/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

/**
 * 我的消息
 */
var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");

var User = require('../domain/user');
var consts = require('../consts/consts');
var MsgType = consts.MsgType;
var MsgStatus = consts.MsgStatus;
var AddFriendStatus = consts.AddFriendStatus;

var userAttrs = {only: ['userId', 'nickName', 'gender', 'headIcon']};


var MyMessageBoxSchema = mongoose.Schema({
  userId: Number,   // 用户Id
  msgType: Number,  // 消息类型 (系统消息, 加好友消息, 聊天消息)
  msgStatus: Number, // 消息状态 (0 - new, 1 - delivered, 2 - read, 3 - delete)
  msgUserId: Number, // 消息相关的用户ID, 系统消息为 0
  msgData: {type: mongoose.Schema.Types.Mixed, default: {_placeholder:''}},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'my_message_boxes'
});

MyMessageBoxSchema.index({userId: 1});


var __toParams = function (model, opts) {
  var transObj = {
    id: model.id,
    userId: model.userId,
    msgUserId: model.msgUserId,
    msgStatus: model.msgStatus,
    msgType: model.msgType,
    msgData: model.msgData,
    updated_at: model.updated_at.getTime()
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

MyMessageBoxSchema.statics.toParams = __toParams;

MyMessageBoxSchema.methods.toParams = function (opts) {
  return __toParams(this, opts);
};


MyMessageBoxSchema.statics.newAddFriendMsgQ = function(userId, requesterInfo) {
  return MyMessageBox.findOneQ({userId: userId, msgUserId: requesterInfo.userId})
    .then(function(msgItem) {
      if (msgItem == null) {
        msgItem = new MyMessageBox();
        msgItem.userId = userId;
        msgItem.msgUserId = requesterInfo.userId;
        msgItem.msgType = MsgType.ADD_FRIEND;
      }

      msgItem.msgStatus = MsgStatus.NEW;
      msgItem.msgData.userInfo = User.toParams(requesterInfo, userAttrs);
      msgItem.msgData.status = AddFriendStatus.NEW;
      msgItem.updated_at = Date.now();
      return msgItem.saveQ();
    });
};

MyMessageBoxSchema.statics.newChatMsgQ = function(fromUserId, toUserId, chatText) {
  var results = {};
  return User.findOneQ({userId: fromUserId})
    .then(function(fromUser) {
      results.fromUser = fromUser;

      var newMsg = new MyMessageBox();
      newMsg.userId = toUserId;
      newMsg.msgType = MsgType.CHAT_MSG;
      newMsg.msgUserId = fromUserId;
      newMsg.msgStatus = MsgStatus.NEW;
      newMsg.msgData.userInfo = User.toParams(fromUser, userAttrs);
      newMsg.msgData.chatText = chatText;

      return newMsg.saveQ();
    });
};

MyMessageBoxSchema.methods.pushNewSysMsg = function() {

};

var MyMessageBox = mongoose.model('MyMessageBox', MyMessageBoxSchema);


module.exports = MyMessageBox;