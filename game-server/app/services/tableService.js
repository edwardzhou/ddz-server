var GameTable = require('../domain/gameTable');
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

exp.init = function() {
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  _tables.push(new GameTable({tableId: _tableId++}));
  return exp;
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