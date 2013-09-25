var util = require('util');
var DomainBase = require('./domainBase');

var Player = function(opts) {
  DomainBase.call(this, opts);
  this.userId = opts.userId;
  this.nickName = opts.nickName;
  this.serverId = opts.serverId;
  this.jsonAttrs = {userId: "uid", nickName: "nick_name"}
};

util.inherits(Player, DomainBase);

module.exports = Player;