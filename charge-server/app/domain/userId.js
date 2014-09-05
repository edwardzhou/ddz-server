/**
 * Created by edwardzhou on 14-4-25.
 */

var mongoose = require('mongoose');
var crypto = require('crypto');

var UserIdSchema = new mongoose.Schema({
  nextUserId: Number,
  updatedAt: {type: Date, default: Date.now}
});

var g_userId = null;

UserIdSchema.statics.retrieveNextUserId = function(cb) {
  var nextUserId = null;
  var _this = this;

  if (!!g_userId) {
    nextUserId = g_userId.nextUserId ++;
    g_userId.updatedAt = Date.now();
    g_userId.increment();
    g_userId.save(function(err, userId, affected) {
      if (!!err || affected < 1) {
        g_userId = null;
        _this.retrieveNextUserId(cb);
        return;
      }
    });
    cb(null, nextUserId);
    return nextUserId;
  }

  this.findOne({}, function(err, userIdObj) {
    if (!!userIdObj) {
      g_userId = userIdObj;
      nextUserId = g_userId.nextUserId ++;
      g_userId.updatedAt = Date.now();
      g_userId.increment();
      g_userId.save();
      cb(null, nextUserId);
    } else {
      var idObj = new UserId();
      idObj.nextUserId = 50002;
      idObj.save(function(err, newIdObj){
        g_userId = newIdObj;
        cb(null, 50001);
      });
    }

  });

  return true;
};

var UserId = mongoose.model('UserId', UserIdSchema);

module.exports = UserId;

