var dispatcher = require('../util/dispatcher');
var Code = require('../../../shared/code');
var Event = require('../consts/consts').Event;
var utils = require('../util/utils');

/**
 * ChatService
 * @param app
 * @constructor
 */
var ChatService = function(app) {
  this.app = app;
  this.uidMap = {};
  this.nameMap = {};
  this.channelMap = {};
};

module.exports = ChatService;


/**
 * add user into chat channel
 * @param {String} uid user id
 * @param {String} fullUserName user's full name
 * @param {String} channelName channel name
 * @returns {Number} see code.js
 */
ChatService.prototype.add = function(uid, fullUserName, channelName) {
  var sid = getSidByUid(uid, this.app);
  if (!sid) {
    return Code.CHAT.FA_UNKNOWN_CONNECTOR;
  }

  if (checkDuplicate(this, uid, channelName)) {
    return Code.OK;
  }

  utils.myPrint('channelName = ', channelName);
  var channel = this.app.get('channelService').getChannel(channelName, true);
  if (!channel) {
    return Code.CHAT.FA_CHANNEL_CREATE;
  }

  channel.add(uid, sid);
  addRecord(this, uid, fullUserName, sid, channelName);

  return Code.OK;

};

ChatService.prototype.leave = function(uid, channelName) {
  var record = this.uidMap[uid];
  var channel = this.app.get('channelService').getChannel(channelName, true);

  if (channel && record) {
    channel.leave(uid, record.sid);
  }

  removeRecord(this, uid, channelName);
};

ChatService.prototype.pushByChannel = function(channelName, msg, cb) {

};

var checkDuplicate = function(service, uid, channelName) {
  return !!service.channelMap[uid] && !!service.channelMap[uid][channelName];
};

var getSidByUid = function(uid, app) {
  var connector = dispatcher.dispatch(uid. app.getServersByType('connector'));
  if(connector) {
    return connector.id;
  }
  return null;
};

var addRecord = function(service, uid, fullUserName, sid, channelName) {
  var record = {
    uid: uid,
    name: fullUserName,
    sid: sid
  };

  service.uidMap[uid] = record;
  service.nameMap[name] = record;
  var item = service.channelMap[uid];
  if(!item) {
    item = service.channelMap[uid] = {};
  }
  item[channelName] = 1;
};

var removeRecord = function(service, uid, channelName) {
  delete service.channelMap[uid][channelName];
  if (utils.size(service.channelMap[uid])) {
    return;
  }

  // if user not in any channel then clear his records
  clearRecords(service, uid);
};

var clearRecord = function(service, uid) {
  delete service.channelMap[uid];

  var record = service.uidMap[uid];
  if(!record) {
    return;
  }

  delete service.uidMap[uid];
  delete service.nameMap[record.name];
}