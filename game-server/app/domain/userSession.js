/**
 * Created by edwardzhou on 14-2-11.
 */

var mongoose = require('mongoose');
var crypto = require('crypto');

var UserSessionSchema = new mongoose.Schema({
  userId: Number,
  sessionToken: String,
  sessionStart: {type:Date, default: Date.now},
  sessionData: Schema.Types.Mixed,
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});

var UserSession = mongoose.model('UserSession', UserSessionSchema);

module.exports = UserSession;