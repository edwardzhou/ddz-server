var GameTable = require('../domain/gameTable');
var utils = require('../util/utils');
var exp = module.exports;

var theApp = null;

exp.init = function(app) {
  theApp = app;
};

exp.pushTableMessage = function(app, table, route, msg, cb) {
  var uids = GameTable.prototype.getPlayerUidsMap.call(table);
  if (uids.length>0) {
    exp.pushMessage(null, route, msg, uids, cb);
  } else {
    utils.invokeCallback(cb, null);
  }
};

exp.pushMessage = function(app, route, msg, uids, cb) {
  var channelService = theApp.get('channelService');
  channelService.pushMessageByUids(route, msg, uids, cb);
};

