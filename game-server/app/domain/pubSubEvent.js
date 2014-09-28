/**
 * Created by edwardzhou on 14-9-4.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

var pubSubEventSchema = new mongoose.Schema({
  eventName: String,
  eventData: {},
  active: {type: Number, default: 1},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'pub_sub_events',
  capped: { size: 1024, max: 1000, autoIndexId: true }
});


var PubSubEvent = mongoose.model('PubSubEvent', pubSubEventSchema);

module.exports = PubSubEvent;