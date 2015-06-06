/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var crc = require('crc');
var os = require('os');

var hostIp = null;

module.exports.dispatch = function(uid, connectors) {
  var clientIp = '192.168.1.1';
	var index = Number(uid) % connectors.length;
  //console.log('[util.dispatch] uid: %s, index: %d, connectors.length: %d', uid, index, connectors.length);

  if (!hostIp) {
    var re = /(\d+\.\d+\.\d+)\.\d+/;
    var clientPattern = clientIp.match(re);
    if (!!clientPattern) {
      clientPattern = clientPattern[1] + ".";
    } else {
      clientPattern = clientPattern + ".";
    }
    var inets = os.networkInterfaces();
    for (var key in inets) {
      var addrs = inets[key];
      for (var addrIndex= 0; addrIndex<addrs.length; addrIndex++) {
        if (addrs[addrIndex].address.search(clientPattern)>=0) {
          hostIp = addrs[addrIndex].address;
          break;
        }
      }

      if (!!hostIp)
        break;
    }
  }

  if (!hostIp) {
    hostIp = connectors[index].clientHost;
  }

  var result = {
    host: hostIp,
    port: connectors[index].clientPort
  };
	return result;
};
