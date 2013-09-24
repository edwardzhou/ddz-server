var GameTable = function(opts) {
  this.tableId = opts.tableId;
  this.players = [];
  this.state = opts.state || 0;
};

module.exports = GameTable;