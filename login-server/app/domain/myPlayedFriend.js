/**
 * Created by edwardzhou on 15/5/16.
 */


/**
 * 与我打过牌的玩家
 */
var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");

var MyPlayedFriendSchema = mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId},
  userId: Number,   // 用户Id
  playedUsers: [{type: mongoose.Schema.Types.Mixed}],
  friends: [{type: mongoose.Schema.Types.Mixed}],
  playedUsersTm: {type: Date, default: Date.now},
  friendsTm: {type: Date, default: Date.now},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'my_played_friends'
});

MyPlayedFriendSchema.index({userId: 1});

var __toParams = function(model, opts) {
  var transObj = {
    userId: model.userId,
    playedUsers: model.playedUsers,
    friends: model.friends,
    friendsTm: model.friendsTm,
    playedUsersTm: model.playedUsersTm,
    updated_at: model.updated_at
  };

  //transObj.playedUsers.sort(function (x, y){
  //  return y.lastPlayed - x.lastPlayed;
  //});

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

MyPlayedFriendSchema.statics.toParams = __toParams;

MyPlayedFriendSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};

MyPlayedFriendSchema.methods.findPlayedUser = function(userId) {
  for (var index=0; index<this.playedUsers.length; index++) {
    if (this.playedUsers[index].userId == userId)
      return this.playedUsers[index];
  }
  return null;
};

MyPlayedFriendSchema.methods.findFriend = function(userId) {
  for (var index=0; index<this.friends.length; index++) {
    if (this.friends[index].userId == userId)
      return this.friends[index];
  }
  return null;
};

MyPlayedFriendSchema.methods.sortPlayedUsers = function() {
  this.playedUsers.sort(function(a, b) {
    return b.lastPlayed - a.lastPlayed;
  });

  this.markModified('playedUsers');
};

MyPlayedFriendSchema.methods.sortFriends = function() {
  this.friends.sort(function(a, b) {
    if (!!a.lastPlayed && !!b.lastPlayed) {
      return b.lastPlayed - a.lastPlayed;
    } else if (!!a.lastPlayed) {
      return -1;
    } else if (!!b.lastPlayed) {
      return 1;
    } else {
      return b.addDate - a.addDate;
    }
  });

  this.markModified('friends');
};

var MyPlayedFriend = mongoose.model('MyPlayedFriend', MyPlayedFriendSchema);


module.exports = MyPlayedFriend;