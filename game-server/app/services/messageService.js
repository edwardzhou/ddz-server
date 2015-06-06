/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var GameTable = require('../domain/gameTable');
var utils = require('../util/utils');
var exp = module.exports;

var theApp = null;

exp.init = function(app) {
  theApp = app;
};

/**
 * 推送信息给桌子的全部用户
 * @param table - 桌子
 * @param route - 消息路由
 * @param msg - 消息体
 * @param cb - 回调
 */
exp.pushTableMessage = function(table, route, msg, cb) {
  // 提取所有可发送的用户 (在线的真实用户）
  var uids = GameTable.prototype.getPlayerUidsMap.call(table);
  if (uids.length>0) {
    // 有真实用户
    exp.pushMessage(route, msg, uids, cb);
  } else {
    // 无，直接回调
    utils.invokeCallback(cb, null);
  }
};

/**
 * 推送消息给指定的一个或多个用户
 * @param route
 * @param msg
 * @param uids
 * @param cb
 */
exp.pushMessage = function(route, msg, uids, cb) {
  var channelService = theApp.get('channelService');
  var validUids = uids.filter(function(uid) {return !!uid.sid});
  if (validUids.length > 0) {
    channelService.pushMessageByUids(route, msg, validUids, cb);
  } else {
    utils.invokeCallback(cb, null);
  }
};

