/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");

var GameServerInstanceSchema = mongoose.Schema({
  serverId: String,
  roomIds: [Number]
}, {
  collection: 'game_server_instances'
});


var GameServerInstance = mongoose.model('GameServerInstance', GameServerInstanceSchema);


module.exports = GameServerInstance;