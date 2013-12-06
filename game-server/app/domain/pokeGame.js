var GameState = require('../consts/consts').GameState;
var PokeCard = require('./pokeCard');
var mongoose = require('mongoose');

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
  lordCards: String,
  // 地主Id
  lordUserId: Number,
  // 牌局开始时间
  startAt: {type: Date},
  // 牌局结束时间
  endAt: {type: Date},
  // 牌局时长(单位秒)
  duration: Number,
  // 游戏结算信息
  score: {
    // 牌局佣金 ( >1 表示固定佣金，<1  表示比例佣金; 如: 100 - 每局收100佣金， 0.05 - 每局收5%佣金)
    rake: Number,
    // 底数
    ante: Number,
    // 地主倍数
    lordValue: Number,
    // 加倍倍数 (每人可要求一次加倍，1人加倍 (x2), 两人 (x4), 三人 (x8))
    redoubles: Number,
    // 已出普通炸弹数 (每炸弹翻一倍)
    bombs: Number,
    // 王炸 (0, 1) x4
    rockets: Number,
    // 0 - 正常, 1 - 春天, -1 - 反春天 (春天/反春天 加倍)
    spring: Number,
    // 输赢总数 = ante x lordValue x (2 ^ doubles) x (2 ^ bombs) x (4 ^ rockets) x (2 ^ abs(spring))
    total: Number,
    // 扣除佣金后的输赢总数 = total - rake, or = total * (1 - rake)
    raked_total: Number
  },
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

/**
 * PokeGame 模型
 * @type {*}
 */
var PokeGame = mongoose.model('PokeGame', pokeGameSchema);

module.exports = PokeGame;

/**
 *
 * @param roomId
 * @param tableId
 * @param players
 * @returns {PokeGame}
 */
PokeGame.newGame = function(roomId, tableId, players) {
  var opts = {roomId: roomId, tableId: tableId, players: players, state: GameState.PENDING_FOR_READY};
  var game = new PokeGame(opts);

  game.players = players.slice(0, players.length);
  game.token = {nextUserId: '', currentSeqNo: 0};

  return game;
};

PokeGame.prototype.getPlayerByUserId = function(userId) {
  var playerIndex = this.getPlayerIndex(userId);
  if (playerIndex >= 0) {
    return this.players[playerIndex];
  }

  return null;
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