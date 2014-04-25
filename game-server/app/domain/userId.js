/**
 * Created by edwardzhou on 14-4-25.
 */

var mongoose = require('mongoose');
var crypto = require('crypto');

var UserIdSchema = new mongoose.Schema({
  nextUserId: Number,
  updatedAt: {type: Date, default: Date.now}
});

var UserId = mongoose.model('UserId', UserIdSchema);

module.exports = UserId;

UserId.retrieveNextUserId = function(cb) {
  UserId.findOne({}, function(err, userId) {
    if (!!userId) {
      
    }
  });
};