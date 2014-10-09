/**
 * Created by edwardzhou on 14-10-9.
 */

var mongoose = require('mongoose-q')();
var PaymentMethod = require('./paymentMethod');

var channelSchema = new mongoose.Schema({
  channelId: Number,
  channelName: String,
  description: String,
  paymentMethod: {type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMethod'},
  enabled: {type: Boolean, default: true},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
}, {
  collection: 'channels'
});

var Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;