/**
 * Created by edwardzhou on 14-9-4.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');


/**
 * 事件订阅发布
 * @type {Mongoose.Schema}
 */
var pubSubEventSchema = new mongoose.Schema({
  eventName: String,                            // 事件名称
  eventData: {},                                // 事件数据，不可修改
  active: {type: Number, default: 1},           // 是否有效, 未处理的事件为true, 处理过的事件为false
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'pub_sub_events',
  capped: { size: 1024, max: 1000, autoIndexId: true }
});


var PubSubEvent = mongoose.model('PubSubEvent', pubSubEventSchema);

module.exports = PubSubEvent;