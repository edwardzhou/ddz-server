/**
 * Created by edwardzhou on 14-9-10.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;

var dataKeyIdSchema = new mongoose.Schema({
  keyName: String,
  nextKeyId: {type: Number, default: 0},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'data_key_id'
});

dataKeyIdSchema.index({keyName: 1}, {unique: true});

dataKeyIdSchema.statics.initKeyIdQ = function(keyName, initValue) {
  this.findOneQ({keyName: keyName});
};

dataKeyIdSchema.statics.nextUserIdQ = function() {
  return this.findOneAndUpdateQ({keyName: 'userId'}, {$inc: {nextKeyId:1}}, {upsert: true})
    .then(function(nextUserId) {
      return nextUserId.nextKeyId;
    });
};

dataKeyIdSchema.statics.nextAppointIdQ = function() {
  return this.findOneAndUpdateQ({keyName: 'appointId'}, {$inc: {nextKeyId:1}}, {upsert: true})
    .then(function(idObj) {
      return idObj.nextKeyId;
    });
};

var DataKeyId = mongoose.model('DataKeyId', dataKeyIdSchema);

module.exports = DataKeyId;