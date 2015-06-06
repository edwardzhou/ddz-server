/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

//var agent = require('webkit-devtools-agent');
//var heapdump = require('heapdump');
var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var tableService = require('./app/services/tableService');
var roomService = require('./app/services/roomService');
var userLevelService = require('./app/services/userLevelService');
var appSignatureService = require('./app/services/appSignatureService');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
require('./app/domain/ArrayHelper');
var UserSession = require('./app/domain/userSession');
var util = require('util');

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
  require('./app/services/taskService').init(app);

  var authConnection = require('./app/filters/authConnection');
  app.before(authConnection());
  app.before(require('./app/filters/signedIn')());

  var mongodbCfg = app.get('mongodb');
  var mongoose = require('mongoose');
  mongoose.connect(mongodbCfg.url, mongodbCfg.options, function (err) {
  });

  var GameServerInstance = require('./app/domain/GameServerInstance');
  GameServerInstance.findQ({})
    .then(function (instances) {
      app.set('gameInstances', instances);
    })

});

app.configure('production|development', 'userSystem|area|auth|ddz', function () {
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
      heartbeat: 60,
      disconnectOnTimeout: true,
      useDict: true,
      setNoDelay: true,
      useProtobuf: true,
      handshake: function (msg, cb) {
        logger.info('handshake -> msg: ', msg, "\n", this, "\n");
        //appSignatureService.verifyAppSign(msg.user.aa, msg.user.ab, msg.user.ac, function(err, success){
        //  if (!!err) {
        //    cb(err, null);
        //  } else {
        //    cb(null, {authKey: 'aaaaaaaaaa'});
        //  }
        //});
        UserSession.verifySession(msg.user.userId, msg.user.sessionToken, msg.user.v, function (err, success) {
          if (!!err) {
            cb(err, null);
          } else {
            cb(null, {authKey: 'aaaaaaaa'});
          }
        });
      }
    });
  var clientIp = require('./app/filters/clientIp');
  app.before(clientIp());
  userLevelService.init(app);
});

// Configure for area server
app.configure('production|development', 'area', function () {
  // require('./app/util/cardUtil').buildCardTypes();
  var curServerId = app.getServerId();
  logger.info("app.getServerId: %s", curServerId);

  var roomServiceName = app.getCurServer().roomService || 'normalRoomService';
  var roomServicePath = util.format('./app/services/%s', roomServiceName);
  logger.info('Server: %s init roomService with: %s', curServerId, roomServicePath);
  var RoomServiceClass = require(roomServicePath);
  //roomService.init(app, gameServer.roomIds);
  logger.info('Server: %s init roomService: ', curServerId, RoomServiceClass);
  var roomService = new RoomServiceClass(app);
  app.set('roomService', roomService);

  if (!!app.getCurServer().instance) {
    var GameServerInstance = require('./app/domain/GameServerInstance');
    GameServerInstance.findOneQ({serverId: curServerId})
      .then(function (gameServer) {
        logger.info('Server: %s init with rooms: %j', curServerId, gameServer.roomIds);
        app.get('roomService').init(gameServer.roomIds);
        userLevelService.init(app);
      })
      .fail(function (error) {
        logger.error('ERROR: failed to load GameServerInstance for [%s]', curServerId, error);
      });
  }

  var cardService = require('./app/services/cardServiceFactory').createNormalCardService();
  cardService.theApp = app;
  cardService.roomService = roomService;
  app.set('cardService', cardService);
  tableService.init();

//  if (curServerId == 'room-server') {
//    var chargeEventService = require('./app/services/chargeEventService');
//    chargeEventService.init(app, {});
//    //app.use(chargeServer, {});
//  }

});

app.configure('production|development', 'events', function () {
  var chargeEventService = require('./app/services/chargeEventService');
  chargeEventService.init(app, {});
  userLevelService.init(app);
});

app.configure('production|development', 'robotServer', function () {
  var robotService = require('./app/services/robotService');
  robotService.init(app, {});
  //app.set('robotService', robotService);
});

app.configure('production|development', function () {
  app.route("area", routeUtil.area);
});


// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
