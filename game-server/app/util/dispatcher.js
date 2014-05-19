var crc = require('crc');
var os = require('os');

var hostIp = null;

module.exports.dispatch = function(uid, connectors) {
	var index = Number(uid) % connectors.length;

  if (!hostIp) {
    var inets = os.networkInterfaces();
    for (var key in inets) {
      var addrs = inets[key];
      for (var index in addrs) {
        if (addrs[index].address.search('192.168.')>=0) {
          hostIp = addrs[index].address;
          break;
        }
      }

      if (!!hostIp)
        break;
    }
  }

  var result = {
    host: hostIp,
    port: connectors[index].clientPort
  };
	return result;
};
