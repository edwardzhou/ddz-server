var util = require('util');
var utils = require('../util/utils');
var EventEmitter = require('events').EventEmitter;
var PlayerState = require('../consts/consts').PlayerState;
var PlayerRole = require('../consts/consts').PlayerRole;
var cardUtil = require('../util/cardUtil');
var DdzProfile = require('./ddzProfile');

var Player = function(opts) {
  opts = opts || {};
  EventEmitter.call(this, opts);
  this.pokeCards = opts.pokeCards || [];
  this.initPokeCards = this.pokeCardsString();
  this.gender = opts.gender;
  this.userId = opts.userId;
  this.nickName = opts.nickName;
  this.serverId = opts.serverId;
  this.headIcon = opts.headIcon;
  this.userSession = opts.userSession;
  this.role = opts.role || PlayerRole.NONE;
  this.state = opts.state || PlayerState.PREPARE_READY;
  this.plays = opts.plays || 0;
  this.prevPlayer = opts.prevPlayer || null;
  this.nextPlayer = opts.nextPlayer || null;
  this.delegating = !!opts.delegating;
  this.robot = opts.robot || false;
  this.roomId = opts.roomId || null;
  this.readyForStartGame = opts.readyForStartGame || false;
};

util.inherits(Player, EventEmitter);

module.exports = Player;

var __toParams = function(model, excludeAttrs) {
  var transObj = {
    userId: model.userId,
    nickName: model.nickName,
    state: model.state,
    headIcon: model.headIcon,
    gender: model.gender,
    pokeCount: model.pokeCount,
    role: model.role
  };

  if (!!model.ddzProfile) {
    if (!!model.ddzProfile.toParams) {
      transObj.ddzProfile = model.ddzProfile.toParams();
    } else {
      transObj.ddzProfile = model.ddzProfile;
    }
  }

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

Player.toParams = __toParams;

Player.prototype.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



Object.defineProperty(Player.prototype, 'playerId', {
  get: function() {return this.userId},
  set: function(_v) {this.userId = _v},
  enumerable: true
});

Object.defineProperty(Player.prototype, 'pokeCount', {
  get: function() { return (!!this.pokeCards)? this.pokeCards.length : 0 },
//  set: function(_v) {this.userId = _v},
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
  return this.state == PlayerState.READY;
};

Player.prototype.isDelegating = function() {
  //return this.state == PlayerState.DELEGATING;
  return this.delegating;
};

Player.prototype.isLord = function() {
  return this.role == PlayerRole.LORD;
};

Player.prototype.isFarmer = function() {
  return this.role == PlayerRole.FARMER;
};

Player.prototype.getUidSid = function() {
  return {uid: this.userId, sid: this.serverId};
};

Player.prototype.isRobot = function() {
  return !!this.robot;
};

Player.prototype.pokeCardsString = function() {
  return cardUtil.pokeCardsToString(this.pokeCards);
};

Player.prototype.updateCoins = function(coins) {
//  var self = this;
//  if (this.ddzProfile)
//  DdzProfile.findOneQ({userId: self.userId})
//    .then(function(ddzProfile) {
//      if (ddzProfile == null) {
//        ddzProfile = new DdzProfile();
//        ddzProfile.coins = 20000;
//        ddzProfile.userId = self.userId;
//      }
//
//      ddzProfile.coins = ddzProfile.coins || 20000;
//
//      ddzProfile.coins += coins;
//      if (coins > 0) {
//        ddzProfile.gameStat.won ++;
//      } else {
//        ddzProfile.gameStat.lose ++;
//      }
//      return ddzProfile.saveQ();
//    })
//    .then(function(ddzProfile) {
//      console.log('[Player.updateCoins] userId: ' + self.userId + ' , coins: ' + ddzProfile.coins);
//    })
//    .fail(function(err) {
//      console.error('[Player.updateCoins] ERROR userId: ' + self.userId + ', ', err);
//    });
};

Player.prototype.reset = function() {
  this.state = PlayerState.PREPARE_READY;
  this.role = PlayerRole.NONE;
  this.setPokeCards([]);
  this.plays = 0;
  this.tableId = null;
  this.delegating = false;
  this.readyForStartGame = false;
  if (!!this.userSession) {
    this.userSession.sset({tableId: null, gameId: null});
    //this.userSession.sset('gameId', null);
  }
};

Player.prototype.fetchDdzProfile = function(callback) {
  DdzProfile.fineOneQ({userId: this.userId})
    .then(function(ddzProfile) {
      utils.invokeCallback(callback, ddzProfile);
    })
    .failed(function(error) {
      console.error('[Player.fetchDdzProfile] ERROR userId: ' + self.userId + ', ', err);
      utils.invokeCallback(callback, null);
    });
};