var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
var tableService = require('./app/services/tableService');

/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'ddz_server');

// configuration for global
app.configure('production|development', function () {
  app.enable('systemMonitor');

  //app.enable('rpcDebugLog')

  app.loadConfig('mongodb', app.getBase() + "/config/mongodb.json");

  require('./app/dao/mongodb/mongodb').init(app, function(err, mongodb) {
    app.set('dbclient', mongodb);
  });

});

// app configuration
app.configure('production|development', 'connector|gate', function () {
  app.set('connectorConfig',
    {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 3,
      useDict: true,
      useProtobuf: true
    });
});

// Configure for area server
app.configure('production|development', 'area', function () {
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
