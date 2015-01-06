var GameState = require('../consts/consts').GameState;
var PokeCard = require('./pokeCard');
var EventEmitter = require('events').EventEmitter;
var mongoose = require('mongoose');
var uuid = require('node-uuid');
var utils = require('../util/utils');

/**
 * 牌局里玩家信息结构
 * @type {Schema}
 */
var gamePlayerSchema = new mongoose.Schema({
  playerId: Number, // 用户id
  initPokeCards: String, // 分到的牌
  isLord: Boolean, // 是否为地主
  score: {type: Number, default: 0} // 输赢
});

/**
 * 牌局游戏结构
 * @type {Schema}
 */
var pokeGameSchema = new mongoose.Schema({
  // 游戏id
  gameId: Number,
  // 房间id
  roomId: Number,
  // 桌子id
  tableId: Number,
  // 前端服务器id
  frontendServerId: String,
  // 后端服务器id
  backendServerId: String,
  // 游戏状态, ref: consts.GameState
  state: Number,
  // 玩家
  //players: [gamePlayerSchema],
  // 动作历史
  actions: [String],
  // 地主牌
  lordCardChars: String,
  // 地主Id
  lordPlayerId: Number,
  // 牌局开始时间
  startAt: {type: Date},
  // 牌局结束时间
  endAt: {type: Date},
  // 牌局时长(单位秒)
  duration: {type: Number, default: 0},
  gameRake: {type: Number, default: 0},
  gameAnte: {type: Number, default: 0},
  lordValue: {type: Number, default: 0},
  lordWon: Boolean,
  // 游戏结算信息
  score: {
    // 牌局佣金 ( >1 表示固定佣金，<1  表示比例佣金; 如: 100 - 每局收100佣金， 0.05 - 每局收5%佣金)
    rake: {type: Number, default: 0},
    // 底数
    ante: {type: Number, default: 0},
    // 地主倍数
    lordValue: {type: Number, default: 0},
    // 加倍倍数 (每人可要求一次加倍，1人加倍 (x2), 两人 (x4), 三人 (x8))
    redoubles: {type: Number, default: 0},
    // 已出普通炸弹数 (每炸弹翻一倍)
    bombs: {type: Number, default: 0},
    // 王炸 (0, 1) x4
    rockets: {type: Number, default: 0},
    // 0 - 正常, 1 - 春天, -1 - 反春天 (春天/反春天 加倍)
    spring: {type: Number, default: 0},
    // 输赢总数 = ante x lordValue x (2 ^ doubles) x (2 ^ bombs) x (4 ^ rockets) x (2 ^ abs(spring))
    total: {type: Number, default: 0},
    // 扣除佣金后的输赢总数 = total - rake, or = total * (1 - rake)
    raked_total: {type: Number, default: 0},
    players: []
  },
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'poke_games'
});


var __toParams = function(model, excludeAttrs) {
  var transObj = {
    gameId: model.gameId,
    roomId: model.roomId,
    tableId: model.tableId,
    gameRake: model.gameRake,
    gameAnte: model.gameAnte,
    lordValue: model.lordValue,
    state: model.state,
    players: [],
    grabbingLord: model.grabbingLord
  };

  for (var index=0; index<model.players.length; index++) {
    transObj.players.push( model.players[index].toParams() );
  }

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

pokeGameSchema.statics.toParams = __toParams;

pokeGameSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};



/**
 * PokeGame 模型
 * @type {*}
 */
var PokeGame = mongoose.model('PokeGame', pokeGameSchema);

module.exports = PokeGame;

PokeGame.newGameId = function() {
  var newId = utils.hashCode(uuid.v1(), true);
  return newId;
};

/**
 *
 * @param roomId
 * @param tableId
 * @param players
 * @returns {PokeGame}
 */
PokeGame.newGame = function(table) {
  var gameRoom = table.room;
  var opts = {
    gameId: PokeGame.newGameId(),
    roomId: gameRoom.roomId,
    gameRake: gameRoom.rake || 0,
    gameAnte: gameRoom.ante || 0,
    lordValue: 0,
    tableId: table.tableId,
    players: table.players,
    state: GameState.PENDING_FOR_READY};
  var game = new PokeGame(opts);

  game.playedPokeBits = [0, 0];

  game.startLordValue = gameRoom.startLordValue || 1;
  game.grabbingLordTimeout = gameRoom.grabbingLordTimeout || 20;
  game.playCardTimeout =gameRoom.playCardTimeout || 30;
  game.cheatRate = gameRoom.playCardCheatRate || 40;
  game.cheatLimit = gameRoom.playCardCheatLimit || 1;
  game.msgNo = 1;
  game.players = table.players.slice(0, table.players.length);
  game.token = {nextUserId: '', currentSeqNo: 0};
  game.playerMsgs = {};
  game.playerMsgs[game.players[0].userId] = [];
  game.playerMsgs[game.players[1].userId] = [];
  game.playerMsgs[game.players[2].userId] = [];

//  game.players[0].prevPlayer = game.players[2];
//  game.players[0].nextPlayer = game.players[1];
//  game.players[1].prevPlayer = game.players[0];
//  game.players[1].nextPlayer = game.players[2];
//  game.players[2].prevPlayer = game.players[1];
//  game.players[2].nextPlayer = game.players[0];

  game.cheatCount = 0;
  return game;
};

PokeGame.prototype.getPlayerByUserId = function(userId) {
  var playerIndex = this.getPlayerIndex(userId);
  if (playerIndex >= 0) {
    return this.players[playerIndex];
  }

  return null;
};

PokeGame.prototype.getTokenPlayer = function() {
  return this.getPlayerByUserId(this.token.nextUserId);
};

PokeGame.prototype.getPlayerIndex = function(userId) {
  for (var index in this.players) {
    if (this.players[index].userId == userId)
      return index;
  }

  return -1;
};

PokeGame.prototype.getNextPlayer = function(userId) {
  var playerIndex = this.getPlayerIndex(userId);
  if (playerIndex < 0)
    return null;

  playerIndex = (playerIndex + 1) % this.players.length;
  return this.players[playerIndex];
};

PokeGame.prototype.getPrevPlayer = function(userId) {
  var playerIndex = this.getPlayerIndex(userId);
  if (playerIndex < 0)
    return null;

  playerIndex = (playerIndex + 2) % this.players.length;
  return this.players[playerIndex];
};
