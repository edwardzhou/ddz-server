/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

module.exports = function(app) {
  return new ChatRemote(app);
};

var ChatRemote = function(app) {
  this.app = app;
  this.channelService = app.get('channelService');
};

var remote = ChatRemote.prototype;

/**
 * Add user into chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {String} flag channel parameter
 *
 */
remote.add = function(uid, sid, name, flag, cb) {
  var channel = this.channelService.getChannel(name, flag);
  var full_username = this.app.get('session').get('full_username')
}

