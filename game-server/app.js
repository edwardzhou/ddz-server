//var agent = require('webkit-devtools-agent');
var heapdump = require('heapdump');
var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var tableService = require('./app/services/tableService');
var roomService = require('./app/services/roomService');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);


/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'ddz_server');

// configuration for global
app.configure('production|development', function () {

  app.set('proxyConfig', {
    timeout: 100 * 60 * 1000
  });

  app.enable('systemMonitor');

  app.loadConfig('mongodb', app.getBase() + "/config/mongodb.json");

  var authConnection = require('./app/filters/authConnection');
  app.before(authConnection());
  app.before(require('./app/filters/signedIn')());
});

app.configure('production|development', 'userSystem|area|auth', function() {
  app.enable('rpcDebugLog');
  var mongodbCfg = app.get('mongodb');
  var mongoose = require('mongoose');
  mongoose.connect(mongodbCfg.url, mongodbCfg.options, function(err) {
  });
});

// app configuration
app.configure('production|development', 'ddz|gate', function () {
  app.set('connectorConfig',
    {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 240,
      useDict: true,
      useProtobuf: true,
      handshake: function(msg, cb) {
        logger.info('handshake -> msg: ', msg, "\n", this, "\n", this.socket);
        cb(null, {authKey: 'aaaaaaaaaa'});
      }
    });

  var clientIp = require('./app/filters/clientIp');
  app.before(clientIp());

});

// Configure for area server
app.configure('production|development', 'area', function () {
  require('./app/util/cardUtil').buildCardTypes();
  var servers = app.getServersByType('area');
  logger.info("app.getServerId: %s", app.getServerId());
  logger.info("servers: %s", servers);
  var room_id = app.getCurServer().room_id;
  var room_ids = [];
  logger.info('room_id: %s , typeof => %s', room_id, typeof room_id);
  if (typeof room_id == 'string') {
    room_id = room_id.substring(1, room_id.length-1);
    room_ids = room_id.split(',');
    for (var index in room_ids) {
      room_ids[index] = parseInt(room_ids[index]);
    }
  } else if(!!room_id && parseInt(room_id) > 0) {
    room_ids.push(room_id);
  }

  roomService.init(app, room_ids);
  require('./app/services/messageService').init(app);
  var cardService = require('./app/services/cardServiceFactory').createNormalCardService();
  app.set('cardService', cardService);
  tableService.init();
});

app.configure('production|development', function () {
  app.route("area", routeUtil.area);
});


// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
