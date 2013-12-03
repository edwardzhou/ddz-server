var util = require('util');
var utils = require('../util/utils');
var DomainBase = require('./domainBase');
var PlayerState = require('../consts/consts').PlayerState;
var cardUtil = require('../util/cardUtil');

var Player = function(opts) {
  DomainBase.call(this, opts);
  this.pokeCards = opt.pokeCards || [];
  this.initPokeCards = this.pokeCardsString();
  this.userId = opts.userId;
  this.nickName = opts.nickName;
  this.serverId = opts.serverId;
  this.state = opts.state || PlayerState.prepareReady;
};

util.inherits(Player, DomainBase);

module.exports = Player;
Player.jsonAttrs = {userId: "uid", nickName: "nick_name", state: "state"};

Object.defineProperty(Player.prototype, 'playerId', {
  get: function() {return this.userId},
  set: function(_v) {this.userId = _v},
  enumerable: true
});

Player.prototype.setPokeCards = function(pokeCards) {
  this.pokeCards = pokeCards;
  this.initPokeCards = this.pokeCardsString();
};

Player.prototype.ready = function(cb) {
  this.state = PlayerState.ready;
  this.emit("ready", this);
  utils.invokeCallback(cb, null, this);
};

Player.prototype.isReady = function() {
  return this.state == PlayerState.ready;
};

Player.prototype.isDelegating = function() {
  return this.state == PlayerState.DELEGATING;
};

Player.prototype.getUidSid = function() {
  return {uid: this.userId, sid: this.serverId};
};


Player.prototype.pokeCardsString = function() {
  return cardUtil.pokeCardsToString(this.pokeCards);
};

Player.prototype.reset = function() {
  this.state = PlayerState.PREPARE_READY;
  this.setPokeCards([]);
}