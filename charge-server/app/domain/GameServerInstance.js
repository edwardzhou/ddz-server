var mongoose = require('mongoose-q')();

var GameServerInstanceSchema = mongoose.Schema({
  serverId: String,
  roomIds: [Number]
}, {
  collection: 'game_server_instances'
});


var GameServerInstance = mongoose.model('GameServerInstance', GameServerInstanceSchema);


module.exports = GameServerInstance;