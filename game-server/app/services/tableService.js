/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var GameTable = require('../domain/gameTable');
var TableState = require('../consts/consts');
var utils = require('../util/utils');
var roomService = require('./roomService');

var _tables = [];
var _tableId = 1;

var exp = module.exports;

var _filterByPlayerCount = function(count, excludeTableId, table) {
  return (table.players.length == count && table.tableId != excludeTableId);
};
var _randomSelect = function(tables) {
  var currentTime = new Date().getTime();
  var index = currentTime % tables.length;
  return tables[index];
};

exp.init = function(opts) {
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  return exp;
};

exp.releaseIdleTables = function(idle_seconds, cb) {
  var iter = _tables.length - 1;
  var idle_ms = idle_seconds * 1000;
  var now = new Date();
  while(iter >= 0) {
    var table = _tables[iter];
    if (table.state == TableState.IDLE && (now - table.lastAccessTime > idle_ms) ) {
      _tables.splice(iter, 1);
    }
    iter --;
  }

  utils.invokeCallback(cb, null);
};

exp.arrangeTable = function(player, lastTableId) {
  var tmpTables = _tables.filter(_filterByPlayerCount.bind(null, 2, lastTableId));
  if (tmpTables.length > 0) {
    return _randomSelect(tmpTables);
  }

  tmpTables = _tables.filter(_filterByPlayerCount.bind(null, 1, lastTableId));
  if (tmpTables.length > 0) {
    return _randomSelect(tmpTables);
  }

  tmpTables = _tables.filter(_filterByPlayerCount.bind(null, 0, lastTableId));
  if (tmpTables.length > 0) {
    return _randomSelect(tmpTables);
  }

  var index = _tables.length;
  for(var i=0; i<10; i++) {
    _tables.push( new GameTable({tableId: _tableId++}) );
  }

  return _tables[index];
};

exp.getTable = function(table_id) {
  for (var index=0; index<_tables.length; index++) {
    if (_tables[index].tableId == table_id) {
      return _tables[index];
    }
  }

  return null;
};

exp.release = function(table) {
  for (var index=0; index < table.players.length; index++) {
    var player = table.players[index];
    if (!!player) {
      player.reset();
    }
  }

  this.pokeGame = null;

  if(!!table.room) {
    roomService.releaseTable(table.room, table);
  }

  table.players.splice(0, table.players.length);
};