var chatRemote = require('../remote/chatRemote');

module.exports = function(app) {
  return new Handler(app);
};

var Handler = function(app) {
  this.app = app;
};

var handler = Handler.prototype;

/**
 * Send messages to users
 *
 * @param {Object} msg message from client
 * @param {Object} session
 * @param {Function} next step callback
 *
 */
handler.send = function(msg, session, next) {
  var room_id = session.get('room_id');
  var user_id = session.uid;
  var channelService = this.app.get('channelService');
  var channel = null;
  var channelName = null;
  var full_username = session.get('full_username');

  var param = {
    msg: msg.content,
    from: full_username,
    target: msg.target
  };

  if (msg.target == "*") {
    channelName = room_id;
  } else {
    channelName = "user_" + msg.target;
  }

  channel = channelService.getChannel(channelName, false);
  if(!! channel) {
    channel.pushMessage("onChat", param);
  } else {
    // warnning no channel exists.
  }

  next(null, {
    route: msg.route
  });
}

