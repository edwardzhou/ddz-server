/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */



/**
 * 我的好友
 */
var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");
var DataKeyId = require('./dataKeyId');


var AppointPlaySchema = mongoose.Schema({
  appointId: Number,
  user_id: {type: mongoose.Schema.Types.ObjectId},
  userId: Number,   // 用户Id
  roomId: Number,
  title: String,
  players: [{}],
  expired_at: {type: Date, expires: 0},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'appoint_plays'
});

AppointPlaySchema.index({userId: 1});
AppointPlaySchema.index({'players.userId': 1});

var __toParams = function(model, opts) {
  var transObj = {
    appointId: model.appointId,
    userId: model.userId,
    title: model.title,
    //players: model.players.toParams(),
    roomId: model.roomId,
    players: model.players,
    expired_at: model.expired_at.getTime(),
    updated_at: model.updated_at.getTime()
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

AppointPlaySchema.statics.toParams = __toParams;

AppointPlaySchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};

AppointPlaySchema.statics.createAppointPlayQ = function(creator, players) {
  return DataKeyId.nextAppointIdQ()
    .then(function(newAppointId){
      var newPlay = new AppointPlay();
      newPlay.appointId = newAppointId;
      newPlay.user_id = creator.id
      newPlay.userId = creator.userId;
      var paramOpts = {only: ['userId', 'nickName', 'gender', 'headIcon']};
      newPlay.players.push(players[0].toParams(paramOpts));
      newPlay.players.push(players[1].toParams(paramOpts));
      newPlay.players.push(players[2].toParams(paramOpts));

      newPlay.expired_at = Date.now() + 2 * 60 * 60 * 1000; // + 2 hours
      return newPlay.saveQ();
    });
};

AppointPlaySchema.statics.getByAppointIdQ = function(appointId) {
  return this.findOneQ({appointId: appointId});
};

AppointPlaySchema.methods.hasPlayer = function(playerId) {
  for (var index=0; index<this.players.length; index++) {
    if (this.players[index].userId == playerId)
      return true;
  }

  return false;
};

var AppointPlay = mongoose.model('AppointPlay', AppointPlaySchema);

module.exports = AppointPlay;