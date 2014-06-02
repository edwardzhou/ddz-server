var crc = require('crc');
var os = require('os');

var hostIp = null;

module.exports.dispatch = function(uid, connectors) {
	var index = Number(uid) % connectors.length;
  //console.log('[util.dispatch] uid: %s, index: %d, connectors.length: %d', uid, index, connectors.length);

  if (!hostIp) {
    var inets = os.networkInterfaces();
    for (var key in inets) {
      var addrs = inets[key];
      for (var addrIndex in addrs) {
        if (addrs[addrIndex].address.search('192.168.0')>=0) {
          hostIp = addrs[addrIndex].address;
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
