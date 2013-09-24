var GameTable = function(opts) {
  this.tableId = opts.tableId;
  this.players = [];
  this.state = opts.state || 0;
};

module.exports = GameTable;

GameTable.prototype.removePlayer = function(playerId) {
  var index = -1;
  for(var i=0; i<this.players.length; i++) {
    if (this.players[i].userId == playerId) {
      index = i;
      break;
    }
  }

  if (index >= 0) {
    return this.players.splice(index, 1);
  }

  return null;
};