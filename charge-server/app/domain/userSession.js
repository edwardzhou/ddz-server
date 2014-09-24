/**
 * Created by edwardzhou on 14-2-11.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var utils = require('../util/utils');

var userSessionSchema = new mongoose.Schema({
  userId: Number,
  mac: String,
  frontendId: String,
  frontendSessionId: Number,
  sessionToken: {type:String, default: uuid.v1},
  sessionStart: {type:Date, default: Date.now},
  sessionData: {type: Schema.Types.Mixed, default: {_placeholder:0}},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now, expires: 60 * 60}
}, {
  collection: 'user_sessions'
});

userSessionSchema.index({sessionToken: 1});

userSessionSchema.statics.createSession = function(userId, mac, cb) {
  var newSession = new this();
  newSession.userId = userId;
  newSession.mac = mac;
  newSession.save(function(err, session) {
    utils.invokeCallback(cb, err, session);
  });
};

userSessionSchema.statics.getByToken = function(token, cb) {
  this.findOne({sessionToken: token}, function(err, userSession){
    utils.invokeCallback(cb, err, userSession);
  });
};

userSessionSchema.statics.getByUserId = function(userId, cb) {
  this.findOne({userId: userId}, function(err, userSession) {
    utils.invokeCallback(cb, err, userSession);
  });
};

userSessionSchema.statics.removeAllByUserId = function(userId, cb) {
  this.remove({userId: userId}, cb);
};

userSessionSchema.methods.sget = function(key) {
  return this.sessionData[key];
};

userSessionSchema.methods.sset = function(key, value) {
  var updateFields = {};
  this.updatedAt = Date.now();
  if (!!key && !!value) {
    this.sessionData[key] = value;
    updateFields['sessionData.' + key] = value;
  } else if (!!key) {
    var map = key;
    for (var k in map) {
      this.sessionData[k] = map[k];
      updateFields['sessionData.' + k] = map[k];
    }
  }
  updateFields['updatedAt'] = this.updatedAt;
  this.update(updateFields, function(err, affected) {
    console.log('update: ', err, affected);
  });
};

userSessionSchema.methods.touchQ = function() {
  this.updatedAt = Date.now();
  return this.saveQ();
};

var UserSession = mongoose.model('UserSession', userSessionSchema);


module.exports = UserSession;