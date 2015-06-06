/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */


var DomainUtils = require("./domainUtils");
var mongoose = require('mongoose-q')();

/**
 * 游戏主机的细项
 * @type {Mongoose.Schema}
 */
var HostItemSchema = new mongoose.Schema({
  host: String,
  port: Number,
  enabled: {type: Boolean, default: true},
  memo: String
});

__HostItemToParams = function(model, opts) {
  var transObj = {
    host: model.host,
    port: model.port,
    memo: model.memo,
    enabled: model.enabled
  };

  DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

HostItemSchema.statics.toParams = __HostItemToParams;
HostItemSchema.methods.toParams = function(opts) {
  return __HostItemToParams(this, opts);
};


/**
 * 应用包对应的服务器信息
 */
var appServerInfoSchema = new mongoose.Schema({
  appPkgName: String,
  appName: String,
  updateVersionUrl: String,
  updateManifestUrl: String,
  updatePackageUrl: String,
  gameServers: [{host: String, port: Number, enabled: {type: Boolean, default: true}, memo: String}],
  enabled: {type: Boolean, default: true},  // 是否启用
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'app_server_infos' // 对应mongodb的集合名
});

var itemsToParams = function(items) {
  var result = [];
  for (var index=0; index<items.length; index++) {
    result.push(items[index].toParams());
  }
  return result;
};

var __toParams = function(model, opts) {
  var transObj = {
    appPkgName: model.appPkgName,
    appName: model.appName,
    updateVersionUrl: model.updateVersionUrl,
    updateManifestUrl: model.updateManifestUrl,
    //gameServers: itemsToParams(model.gameServers),
    gameServers: model.gameServers,
    enabled: model.enabled
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

appServerInfoSchema.statics.toParams = __toParams;

appServerInfoSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};

appServerInfoSchema.methods.addGameServer = function(server) {
  if (this.gameServers == null) {
    this.gameServers = [];
  }
  var newHost = {host: server.host, port: server.port, memo: server.memo};
  if (typeof server.enabled != 'undefined') {
    newHost.enabled = server.enabled;
  }
  this.gameServers.push(newHost);
  this.markModified('gameServers');
};


var AppServerInfo = mongoose.model('AppServerInfo', appServerInfoSchema);

module.exports = AppServerInfo;