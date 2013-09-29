var util = require('util');
var utils = require('../util/utils');
var DomainBase = require('./domainBase');
var PlayerState = require('../consts/consts').PlayerState;
var cardUtil = require('../util/cardUtil');

var Player = function(opts) {
  DomainBase.call(this, opts);
  this.pokeCards = [];
  this.userId = opts.userId;
  this.nickName = opts.nickName;
  this.serverId = opts.serverId;
  this.state = PlayerState.prepareReady;
  this.jsonAttrs = {userId: "uid", nickName: "nick_name", state: "state"};
};

util.inherits(Player, DomainBase);

module.exports = Player;

Player.prototype.ready = function(cb) {
  this.state = PlayerState.ready;
  this.emit("ready", this);
  utils.invokeCallback(cb, null, this);
};

Player.prototype.isReady = function() {
  return this.state == PlayerState.ready;
};

Player.prototype.getUidSid = function() {
  return {uid: this.userId, sid: this.serverId};
};


Player.prototype.pokeCardsString = function() {
  return cardUtil.pokeCardsToString(this.pokeCards);
};
