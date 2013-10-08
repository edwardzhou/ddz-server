var newPomelo = require('./lib/pomelo-client');
var options =require('node-options');

var host = "dev";
var port = "4001";
//var room_id = 2;
var table_id = -1;

var userId = Math.ceil(Math.random() * 1000) + 1000;

var connectServer = function(room_id, userId) {
  var pomelo = newPomelo();

  console.log("[%d] this userId: %s", userId, userId);

  pomelo.on('onPlayerJoin', function(msg){
    console.log('[%d] onPlayerJoin: ', userId, JSON.stringify(msg));
  });
  pomelo.on('onPlayerLeave', function(msg){
    console.log('[%d] onPlayerLeave: ', userId, JSON.stringify(msg));
  });
  pomelo.on('onGameStart', function(msg){
    console.log('[%d] onGameStart: ', userId, JSON.stringify(msg));
    if (msg.grabLord > 0) {
      grabLord(3);
    }
  });
  pomelo.on('onGrabLord', function(msg){
    console.log('[%d] onGrabLord: ', userId, JSON.stringify(msg));
    if (!!msg.lordUserId && msg.lordUserId == userId) {
      setTimeout(1000, function() {
        playCard('a');
      });
      //playCard('a');
    }
  });
  pomelo.on('onPlayCard', function(msg) {
    console.log('[%d] onPlayCard:  ', userId, JSON.stringify(msg));
    if (msg.nextUserId == userId) {
      setTimeout(1000, function() {
        playCard('a');
      });
    }
  });

  function playCard(card) {
    pomelo.request('connector.gameHandler.playCard', {card: card}, function(data) {
    });
  }

  function queryEntry(uid, callback) {
    var route = 'gate.gateHandler.queryEntry';
    pomelo.init({
      host: host,
      port: port,
      log: true
    }, function(){
      pomelo.request(route, {
        uid: uid
      }, function(data) {
        pomelo.disconnect();
        callback(data.host, data.port);
      });
    });
  }

  function readyGame() {
    pomelo.request("connector.gameHandler.ready", {}, function(data) {
      console.log("[%s] readyGame success.", userId);
    });
  }

  function grabLord(lordValue) {
    pomelo.request("connector.gameHandler.grabLord", {
      lordValue: lordValue
    }, function(data) {
      console.log("[%s] grabLord success [lordValue: %d].", userId, lordValue);
    });
  };

  function connect() {
    queryEntry(userId, function(host, port){
      pomelo.init({
        host: host,
        port: port,
        log: true
      }, function() {

        pomelo.request("connector.entryHandler.enterRoom", {uid: userId, room_id: room_id}, function(data) {
          var table = data.table;
          var users = table.players;
          console.log("[%d] server_id: ", userId, data.server_id);
          console.log("[%d] room_server_id: ", userId, data.room_server_id);
          console.log("[%d] table: ", userId, JSON.stringify(table));
          for(var index in users) {
            var user = users[index];
            console.log("[%d] user: ", userId, JSON.stringify(user));
          }

          table_id = table.tid;

          readyGame();

        });

        pomelo.request("connector.entryHandler.queryRooms", {}, function(data) {
          console.log("[%d] rooms: " , userId, JSON.stringify(data));
          for(var index in data) {
            var room = data[index];
            console.log("[%d] room: " , userId, JSON.stringify(room));
          }
        });

      });
    });
  }

  connect();

  return pomelo;

};

var opts = {
  "server" : "dev",
  "port" : 4001,
  "start" : 1000,
  "count" : 99,
  "room_id" : 1
};


var args = options.parse(process.argv.slice(2), opts)


if (args.errors) {
  console.log('"Unknown arggument(s): "' + args.errors.join('","'));
  console.log('USAGE: [--server=dev] [--port=80] [--start=1000] [--count=99]')
  process.exit(-1)
}

var startId = Number(opts.start);
var count = opts.count;
host = opts.server;
port = opts.port;

for(var i=0; i<count; i++) {
  connectServer((i%3 +1), startId + i);
}

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on("data", function(chunk) {
  //process.stdout.write(chunk);
  if (chunk.trim() == "exit")
    process.exit(0);
});

