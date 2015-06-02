/**
 * Created by jeffcao on 15/4/23.
 */
/**
 * 我的消息
 */
var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");
var AddFriendStatus = require('../consts/consts').AddFriendStatus;
var User = require('./user');

var MyMessageBoxSchema = mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId},
  userId: Number,   // 用户Id
  addFriendMsgs: [{type: mongoose.Schema.Types.Mixed}],
  sysMsgs: [{type: mongoose.Schema.Types.Mixed}],
  chatMsgs: [{type: mongoose.Schema.Types.Mixed}],
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'my_message_boxes'
});

MyMessageBoxSchema.index({userId: 1});


var __toParams = function (model, opts) {
  var transObj = {
    userId: model.userId,
    addFriendMsgs: model.addFriendMsgs,
    updated_at: model.updated_at
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

MyMessageBoxSchema.statics.toParams = __toParams;

MyMessageBoxSchema.methods.toParams = function (opts) {
  return __toParams(this, opts);
};

MyMessageBoxSchema.statics.findByUserQ = function(user) {
  var thisClass = this;
  return MyMessageBox.findOneQ({userId: user.userId})
    .then(function(msgBox) {
      if (!msgBox) {
        msgBox = new MyMessageBox();
        msgBox.userId = user.userId;
        msgBox.user_id = user.id;
        return msgBox.saveQ();
      }
      return msgBox;
    });
};

MyMessageBoxSchema.methods.findFromArray = function (array, key, value) {
  if (array == null)
    return null;

  for (var index=0; index<array.length; index++) {
    if (array[index][key] == value) {
      return array[index];
    }
  }

  return null;
};

MyMessageBoxSchema.methods.pushNewAddFriendMsg = function (requestor) {
  var userAttrs = {only: ['userId', 'nickName', 'gender', 'headIcon']};
  var newMsg = {
    msgId: mongoose.Types.ObjectId(),
    userId: requestor.userId,
    userInfo: User.toParams(requestor, userAttrs),
    status: AddFriendStatus.NEW,
    date: Date.now()
  };

  this.addFriendMsgs.push(newMsg);
  this.markModified('addFriendMsgs');

  return newMsg;
};

MyMessageBoxSchema.methods.pushNewChatMsg = function (sender, chatMsg) {
  var userAttrs = {only: ['userId', 'nickName', 'gender', 'headIcon']};
  var newMsg = {
    msgId: mongoose.Types.ObjectId().toString(),
    userId: sender.userId,
    userInfo: User.toParams(sender, userAttrs),
    chatMsg: chatMsg,
    status: 0,
    date: Date.now()
  };

  this.chatMsgs.push(newMsg);
  this.markModified('chatMsgs');

  return newMsg;
};




var MyMessageBox = mongoose.model('MyMessageBox', MyMessageBoxSchema);


module.exports = MyMessageBox;