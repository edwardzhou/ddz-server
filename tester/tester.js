var newPomelo = require('./lib/pomelo-client');
var options =require('node-options');

var host = "dev";
var port = "4001";
//var room_id = 2;
var table_id = -1;
//var seqNo = 0;

var userId = Math.ceil(Math.random() * 1000) + 1000;

var connectServer = function(room_id, userId) {
  var pomelo = newPomelo();
  var seqNo = 0;
  var pokeCards = "";

  console.log("[%d] this userId: %s", userId, userId);

  pomelo.on('onPlayerJoin', function(msg){
    console.log('[%d] onPlayerJoin: ', userId, JSON.stringify(msg));
  });
  pomelo.on('onPlayerLeave', function(msg){
    console.log('[%d] onPlayerLeave: ', userId, JSON.stringify(msg));
  });
  pomelo.on('onPlayerReady', function(msg) {
    console.log('[%d] onPlayerReady: ', userId, JSON.stringify(msg));
  });
  pomelo.on('onGameStart', function(msg){
    console.log('[%d] onGameStart: ', userId, JSON.stringify(msg));
    pokeCards = msg.pokeCards;
    if (msg.grabLord > 0) {
      seqNo = msg.seqNo;
      grabLord(3, 1);
    }
  });
  pomelo.on('onGrabLord', function(msg){
    console.log('[%d] onGrabLord: ', userId, JSON.stringify(msg));
    if (!!msg.lordUserId && msg.lordUserId == userId) {
      seqNo = msg.seqNo;
      setTimeout(function() {
        playCard(pokeCards[0], seqNo);
      }, 1000);
      //playCard('a');
    }
  });
  pomelo.on('onPlayCard', function(msg) {
    console.log('[%d] onPlayCard:  ', userId, JSON.stringify(msg));
    if (msg.nextUserId == userId) {
      seqNo = msg.seqNo;
      setTimeout(function() {
        playCard(pokeCards[0], seqNo);
      }, 1000);
    }
  });

  function playCard(card, seqNo) {
    console.log('[%d] playCard: ', userId, arguments);
    pomelo.request('connector.gameHandler.playCard', {card: card, seqNo: seqNo}, function(data) {
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

  function grabLord(lordValue, seqNo) {
    pomelo.request("connector.gameHandler.grabLord", {
      lordValue: lordValue,
      seqNo: seqNo
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

          table_id = table.tableId;

          readyGame();

        });

//        pomelo.request("ddz.entryHandler.queryRooms", {}, function(data) {
//          console.log("[%d] rooms: " , userId, JSON.stringify(data));
//          for(var index in data) {
//            var room = data[index];
//            console.log("[%d] room: " , userId, JSON.stringify(room));
//          }
//        });

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
  "room_id" : -1
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
room_id = opts.room_id;

for(var i=0; i<count; i++) {
  var rid = room_id;
  if (rid < 0)
    rid = (i%3 + 1);
  connectServer(rid, startId + i);
}

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on("data", function(chunk) {
  //process.stdout.write(chunk);
  if (chunk.trim() == "exit")
    process.exit(0);
});

