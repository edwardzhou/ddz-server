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
  var nextUserId = null;

  if (!!UserId.idObj) {
    nextUserId = UserId.idObj.nextUserId ++;
    UserId.idObj.updatedAt = Date.now();
    UserId.idObj.increment();
    UserId.idObj.save();
    cb(nextUserId);
    return nextUserId;
  }

  UserId.findOne({}, function(err, userIdObj) {
    if (!!userIdObj) {
      UserId.idObj = userIdObj;
      nextUserId = UserId.idObj.nextUserId ++;
      UserId.idObj.updatedAt = Date.now();
      UserId.idObj.increment();
      UserId.idObj.save();
      cb(nextUserId);
    } else {
      var idObj = new UserId();
      idObj.nextUserId = 50002;
      idObj.save(function(err, newIdObj){
        UserId.idObj = newIdObj;
        cb(50001);
      });
    }

  });

  return true;
};