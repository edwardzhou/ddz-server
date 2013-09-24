var MongoClient = require('mongodb').MongoClient
  , Server = require('mongodb').Server;

var utils = require("../../util/utils");

var _db = null;
var dbclient = module.exports;

dbclient.init = function(app, cb) {
  if (!! _db) {
    utils.invokeCallback(cb, null, _db);
  } else {
    var dbConfig = app.get('mongodb');
    MongoClient.connect(dbConfig.url, dbConfig.options, function(err, db) {
      _db = db;
      utils.invokeCallback(cb, err, _db);
    });
  }

  return dbclient;
};
