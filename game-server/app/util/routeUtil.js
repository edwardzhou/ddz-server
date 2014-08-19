var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

exp.area = function(session, msg, app, cb) {
  //logger.info('[<Server: %s> routUtil.area] msg: %j', app.getServerId(), msg);
  var room_id = session.get('room_id') || msg.room_id ;
  logger.info('[<Server: %s> routUtil.area] room_id: %d', app.getServerId(), room_id);

  var area_servers = app.getServersByType("area");

  var serverId = null;
  for (var index=0; index<area_servers.length; index++) {
    //logger.info("<Server: %s> area_servers[%d]: %j", app.getServerId(), index, area_servers[index]);
    if (area_servers[index].room_id == room_id) {
      serverId = area_servers[index].id;
    } else if(typeof(area_servers[index].room_id) == 'string') {
      var rid = area_servers[index].room_id;
      var room_ids = eval(rid);
      for (var room_index=0; index<room_ids.length; index++) {
        if (parseInt(room_ids[room_index]) == room_id) {
          serverId = area_servers[index].id;
          break;
        }
      }
    }

    if (!!serverId) {
      break;
    }
  }

  serverId = serverId || area_servers[0].id;
//
  logger.info('[<Server: %s> routUtil.area] serverId: %s', app.getServerId(), serverId);

  if(!serverId) {
    var err = new Error('can not find server info for type: ' + msg.serverType + " , room_id: " + room_id);
    err.errorCode = 10001;
    cb(err);
    return;
  }

  cb(null, serverId);

};

