var mongoose = require('mongoose');
var util = require('util');
var DomainBase = require('./domainBase');
var GameTable = require('./gameTable');

/**
 * 房间Mongodb架构的字段定义
 */
var roomSchemaFields = {
  roomId: Number,     // 房间Id
  roomName: String,   // 房间名称
  roomDesc: String,   // 描述
  state: Number,      // 状态, ref: RoomState
  ante: Number,       // 底注
  rake: Number,       // 佣金
  roomType: String,   // 房间类型
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
};

// 根据字段定义创建架构，再生成房间信息模型
var roomSchema = new mongoose.Schema(roomSchemaFields);
var GameRoomInfo = mongoose.model('GameRoom', roomSchema);

/**
 * 游戏房间
 * @param opts
 * @constructor
 */
var GameRoom = function(opts) {
  DomainBase.call(this, opts);
  // 初始化房间信息
  this.info = new GameRoomInfo(opts);

  // 游戏桌子对照表(tableId -> table), 用于速查
  this.tablesMap = {};
  // 房间里玩家对照表(playerId -> player), 用于速查
  this.playersMap = {};
  // 桌子列表
  this.tables = [];
  // 下一张新桌子的Id
  this.tableNextId = 1;

  if (!!opts.tables) {
    for(var index in opts.tables) {
      var table = opts.tables[index]
      this.tables.push(table);
      this.tablesMap[table.tableId] = table;
      if (this.tableNextId <= table.tableId)
        this.tableNextId = table.tableId + 1;
    }
  }

  if(!!opts.tableNextId) {
    this.tableNextId = Number(opts.tableNextId);
  }
};

// 令GameRoom继承于DomainBase
util.inherits(GameRoom, DomainBase);

// 导出GameRoom
module.exports = GameRoom;

/**
 * 定义GameRoom的json字段对照
 * @type {{info.roomName: string, info.roomId: string}}
 */
GameRoom.jsonAttrs = {
  'roomId' : 'roomId',
  'roomName' : 'roomName'
};

/**
 * 添加属性访问委托，把对this.propName委托到this.to.propName
 * @param obj
 * @param to
 * @param propName
 */
var delegateProperty = function(obj, to, propName) {
  Object.defineProperty(obj, propName, {
    get: function() {
      //console.log('get propName: %s', propName);
      return this[to][propName];
    },
    set: function(_v) {
      //console.log('set propName: %s  ==> ', propName, _v);
      this[to][propName] = _v;
    },
    enumerable : true
  });

};

// 把GameRoomInfo的属性导出到GameRoom上
var propNames = Object.getOwnPropertyNames(roomSchemaFields);
var GameRoomPrototype = GameRoom.prototype;
for (var index in propNames) {
  var propName = propNames[index];
  delegateProperty(GameRoomPrototype, 'info', propName);
}


/**
 * 取新桌子id
 * @returns {number}
 */
GameRoom.prototype.getNextTableId = function() {
  return this.tableNextId ++;
};

/**
 * 找出玩家数量等于count的桌子，排除桌子id为excludeTableId的桌子
 * @param count - 玩家数量
 * @param excludeTableId - 要排除的桌子id
 * @param table - 用于比较的桌子
 * @returns {boolean} - true表示桌子符合条件，false不符合
 * @private
 */
var _filter = function(count, excludeTableId, table) {
  return ((table.players.length == count) && (table.tableId != excludeTableId));
};

/**
 * 随机在给出的tables里面取一个桌子
 * @param tables - 桌子列表
 * @returns {*} - table
 * @private
 */
var _randomSelect = function(tables) {
  var currentTime = new Date().getTime();
  var index = currentTime % tables.length;
  return tables[index];
};

/**
 * 玩家进入房间
 * 当有玩家进入房间时，自动将玩家安排到一张桌子。安排顺序为，
 * 1. 优先分配到已经有两个玩家的桌子;
 * 2. 如没有，尝试分配到已经有一个玩家的桌子;
 * 3. 安排玩家到一个无人的桌子
 * 备注：如果当前空闲的桌子不足3张，则再生成一些新桌子，然后安排玩家
 * @param player - 进入房间的玩家
 * @param lastTableId - 上次进入房间时，被安排的桌子编号
 * @returns {}
 */
GameRoom.prototype.enter = function (player, lastTableId) {
  var self = this;

  // 安排桌子
  var table = function() {
    // 尝试安排到二人桌
    var tmpTables = this.tables.filter(_filter.bind(null, 2, lastTableId));
    if (tmpTables.length > 0) {
      return _randomSelect(tmpTables);
    }

    // 尝试安排到一人桌
    tmpTables = this.tables.filter(_filter.bind(null, 1, lastTableId));
    if (tmpTables.length > 0) {
      return _randomSelect(tmpTables);
    }

    // 尝试安排到无人桌
    tmpTables = this.tables.filter(_filter.bind(null, 0, lastTableId));
    if (tmpTables.length > 3) {
      return _randomSelect(tmpTables);
    }

    // 无足够空桌
    return null;
  }.apply(this);

  // 如果没有安排到桌子，则生成一些新桌子
  if (!table) {
    var index = this.tables.length;
    for(var i=0; i<10; i++) {
      var newTable = new GameTable({tableId: this.getNextTableId(), room: this});
      this.tables.push(newTable);
      this.tablesMap[newTable.tableId] = newTable;
    }

    table = this.tables[index];
  }

  // 玩家加入桌子
  player = table.addPlayer(player);
  this.playersMap[player.userId] = player;

  return table;
};

/**
 * 取指定id的桌子
 * @param tableId
 * @returns {*}
 */
GameRoom.prototype.getGameTable = function(tableId) {
  return this.tablesMap[tableId];
};

/**
 * 取指定id的玩家
 * @param playerId
 * @returns {*}
 */
GameRoom.prototype.getPlayer = function(playerId) {
  return this.playersMap[playerId];
};

/**
 * 玩家离开房间
 * @param playerId
 * @returns {*}
 */
GameRoom.prototype.leave = function(playerId) {
  var player = this.getPlayer(playerId);
  var table = this.getGameTable(player.tableId);
  table.removePlayer(playerId);
  delete this.playersMap[playerId];
  player.tableId = -1;
  return table;
};