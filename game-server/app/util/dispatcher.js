var crc = require('crc');

module.exports.dispatch = function(uid, connectors) {
	var index = Number(uid) % connectors.length;
  var result = {
    host: connectors[index].clientHost,
    port: connectors[index].clientPort
  };
	return result;
};
