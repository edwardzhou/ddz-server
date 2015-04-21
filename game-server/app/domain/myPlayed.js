/**
 * Created by edwardzhou on 15/4/21.
 */


var mongoose = require('mongoose-q')();
var User = require('./user');

var MyPlayedSchema = mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId},
  userId: Number,   // 用户Id
  playedUsers: [{
    //user_id: {type: mongoose.Schema.Types.ObjectId},
    userId: Number,
    nickName: String,
    gender: String,
    headIcon: Number,
    lastPlayed: {type: Date, default: Date.now},
    gameStat: {     // 输赢统计
      won: {type: Number, default: 0},
      lose: {type: Number, default: 0}
    }
  }],
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'my_played'
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