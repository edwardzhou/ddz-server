/**
 * Created by jeffcao on 15/4/23.
 */
/**
 * 我的消息
 */
var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");


var MyMessageBoxSchema = mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId},
  userId: Number,   // 用户Id
  addFriendMsgs: [{type: mongoose.Schema.Types.Mixed}],
  sysMsgs: [{type: mongoose.Schema.Types.Mixed}],
  chatMsg: [{type: mongoose.Schema.Types.Mixed}],
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


var MyMessageBox = mongoose.model('MyMessageBox', MyMessageBoxSchema);


module.exports = MyMessageBox;