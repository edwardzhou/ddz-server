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

  require('./app/services/messageService').init(app);

  var authConnection = require('./app/filters/authConnection');
  app.before(authConnection());
  app.before(require('./app/filters/signedIn')());

  var mongodbCfg = app.get('mongodb');
  var mongoose = require('mongoose');
  mongoose.connect(mongodbCfg.url, mongodbCfg.options, function(err) {
  });

  var GameServerInstance = require('./app/domain/GameServerInstance');
  GameServerInstance.findQ({})
    .then(function(instances) {
      app.set('gameInstances', instances);
    })

});

app.configure('production|development', 'userSystem|area|auth|ddz', function() {
//  auth.enable('rpcDebugLog');
//  var mongodbCfg = app.get('mongodb');
//  var mongoose = require('mongoose');
//  mongoose.connect(mongodbCfg.url, mongodbCfg.options, function(err) {
//  });
});

// app configuration
app.configure('production|development', 'ddz|gate', function () {
  app.set('connectorConfig',
    {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 10,
      disconnectOnTimeout: true,
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
  // require('./app/util/cardUtil').buildCardTypes();
  var curServerId = app.getServerId();
  logger.info("app.getServerId: %s", curServerId);

  if (!!app.getCurServer().instance) {
    var GameServerInstance = require('./app/domain/GameServerInstance');
    GameServerInstance.findOneQ({serverId: curServerId})
      .then(function(gameServer) {
        logger.info('Server: %s init with rooms: %j', curServerId, gameServer.roomIds);
        roomService.init(app, gameServer.roomIds);
      })
      .fail(function(error) {
        logger.error('ERROR: failed to load GameServerInstance for [%s]', curServerId, error);
      });
  }

  var cardService = require('./app/services/cardServiceFactory').createNormalCardService();
  app.set('cardService', cardService);
  tableService.init();

//  if (curServerId == 'room-server') {
//    var chargeEventService = require('./app/services/chargeEventService');
//    chargeEventService.init(app, {});
//    //app.use(chargeServer, {});
//  }

});

app.configure('production|development', 'events', function() {
  var chargeEventService = require('./app/services/chargeEventService');
  chargeEventService.init(app, {});
});

app.configure('production|development', function () {
  app.route("area", routeUtil.area);
});


// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
