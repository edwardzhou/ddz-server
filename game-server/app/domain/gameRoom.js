var GameTable = require('./gameTable');

var GameRoom = function(opts) {
  this._id = opts._id;
  this.roomId = opts.roomId;
  this.roomName = opts.roomName;
  this.tablesMap = {};
  this.playersMap = {};
  this.tables = [];
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

module.exports = GameRoom;

GameRoom.prototype.getNextTableId = function() {
  return this.tableNextId ++;
};

var _filter = function(count, excludeTableId, table) {
  return ((table.players.length == count) && (table.tableId != excludeTableId));
};

var _randomSelect = function(tables) {
  var currentTime = new Date().getTime();
  var index = currentTime % tables.length;
  return tables[index];
};

GameRoom.prototype.enter = function (player, lastTableId) {
  var self = this;

  var table = function() {
    var tmpTables = this.tables.filter(_filter.bind(null, 2, lastTableId));
    if (tmpTables.length > 0) {
      return _randomSelect(tmpTables);
    }

    tmpTables = this.tables.filter(_filter.bind(null, 1, lastTableId));
    if (tmpTables.length > 0) {
      return _randomSelect(tmpTables);
    }

    tmpTables = this.tables.filter(_filter.bind(null, 0, lastTableId));
    if (tmpTables.length > 3) {
      return _randomSelect(tmpTables);
    }

    return null;
  }.apply(this);

  if (!table) {
    var index = this.tables.length;
    for(var i=0; i<10; i++) {
      var newTable = new GameTable({tableId: this.getNextTableId()});
      this.tables.push(newTable);
      this.tablesMap[newTable.tableId] = newTable;
    }

    table = this.tables[index];
  }


  player = table.addPlayer(player);
  this.playersMap[player.userId] = player;

  return table;
};

GameRoom.prototype.getGameTable = function(tableId) {
  return this.tablesMap[tableId];
};

GameRoom.prototype.getPlayer = function(playerId) {
  return this.playersMap[playerId];
};

GameRoom.prototype.leave = function(playerId) {
  var player = this.getPlayer(playerId);
  var table = this.getGameTable(player.tableId);
  table.removePlayer(playerId);
  delete this.playersMap[playerId];
  player.tableId = -1;
  return table;
};