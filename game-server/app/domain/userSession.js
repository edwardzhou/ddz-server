/**
 * Created by edwardzhou on 14-2-11.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var utils = require('../util/utils');


/**
 * 用户会话数据
 * @type {Mongoose.Schema}
 */
var userSessionSchema = new mongoose.Schema({
  userId: Number, // 用户ID
  mac: String,    // 用户登录时的mac
  frontendId: String, // 前端服务器ID
  frontendSessionId: Number,  // 前端服务器的SessionId
  sessionToken: {type:String, default: uuid.v1},  // 会话token
  sessionStart: {type:Date, default: Date.now},   // 会话起始时间
  sessionData: {type: Schema.Types.Mixed, default: {_placeholder:0}}, // 会话数据
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now, expires: 60 * 60} // 默认有效时间为一小时
}, {
  collection: 'user_sessions'
});

userSessionSchema.index({sessionToken: 1});

/**
 * 为用户创建新的会话数据
 * @param userId - 用户id
 * @param mac - 设备mac
 * @param frontendId - 前端服务器id (如 ddz-server-1 )
 * @param frontendSessionId - 前端服务器上的sessionId
 * @param cb
 */
userSessionSchema.statics.createSession = function(userId, mac, frontendId, frontendSessionId, cb) {
  var newSession = new this();
  newSession.userId = userId;
  newSession.mac = mac;
  newSession.frontendId = frontendId;
  newSession.frontendSessionId = frontendSessionId;
  newSession.save(function(err, session) {
    utils.invokeCallback(cb, err, session);
  });
};


/**
 * 根据Token获取会话数据
 * @param token
 * @param cb
 */
userSessionSchema.statics.getByToken = function(token, cb) {
  this.findOne({sessionToken: token}, function(err, userSession){
    utils.invokeCallback(cb, err, userSession);
  });
};

/**
 * 根据userId获取会话数据
 * @param userId
 * @param cb
 */
userSessionSchema.statics.getByUserId = function(userId, cb) {
  this.findOne({userId: userId}, function(err, userSession) {
    utils.invokeCallback(cb, err, userSession);
  });
};


/**
 * 删除该userId的所有会话数据
 * @param userId
 * @param cb
 */
userSessionSchema.statics.removeAllByUserId = function(userId, cb) {
  this.remove({userId: userId}, cb);
};


/**
 * 获取数据项
 * @param key - 数据项key
 * @returns {*}
 */
userSessionSchema.methods.sget = function(key) {
  return this.sessionData[key];
};

/**
 * 设置数据项, 数据会自动同步到数据库
 * @param key - 数据key
 * @param value - 数据value
 */
userSessionSchema.methods.sset = function(key, value) {
  var updateFields = {};
  this.updated_at = Date.now();
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
  updateFields['updated_at'] = this.updated_at;
  this.update(updateFields, function(err, affected) {
    console.log('update: ', err, affected);
  });
};

/**
 * 延长本会话数据的有效期
 * @returns {*}
 */
userSessionSchema.methods.touchQ = function() {
  this.updated_at = Date.now();
  return this.saveQ();
};

var UserSession = mongoose.model('UserSession', userSessionSchema);


module.exports = UserSession;