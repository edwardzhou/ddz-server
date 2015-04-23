/**
<<<<<<< HEAD
 * Created by jeffcao on 15/4/21.
 */
/**
 * 与我打过牌的玩家
 */
var mongoose = require('mongoose-q')();

var MyPlayedSchema = mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId},
  userId: Number,   // 用户Id
  playedUsers: {type: mongoose.Schema.Types.Mixed},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'my_playeds'
});

var __toParams = function(model, opts) {
  var transObj = {
    userId: model.userId,
    playedUsers: model.playedUsers,
    updated_at: model.updated_at
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

MyPlayedSchema.statics.toParams = __toParams;

MyPlayedSchema.methods.toParams = function(opts) {
    return __toParams(this, opts);
};

var MyPlayed = mongoose.model('MyPlayed', MyPlayedSchema);


module.exports = MyPlayed;