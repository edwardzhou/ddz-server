var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

exp.room = function(session, msg, app, cb) {
  var room_id = session.get('room_id');

  var room_servers = app.getServersByType("room");

  var serverId = null;
  for (var index in room_servers) {
    logger.info("<Server: %s> room_servers[%d]: %j", app.getServerId(), index, room_servers[index]);
    if (room_servers[index].room_id == room_id)
      serverId = room_servers[index].id;
  }

  serverId = serverId || room_servers[0].id;

  if(!serverId) {
    cb(new Error('can not find server info for type: ' + msg.serverType + " , room_id: " + room_id));
    return;
  }

  cb(null, serverId);

};

