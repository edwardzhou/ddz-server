/**
 * Created by edwardzhou on 14/12/4.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var uuid = require('node-uuid');
var utils = require('../util/utils');
var User = require('./user');

/**
 * 任务定义
 * @type {Mongoose.Schema}
 */
var userTaskSchema = new mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  task_id: {type: mongoose.Schema.Types.ObjectId, ref: 'TaskDef'},
  taskId: {type: String, required: "{task id} is required!"},
  taskName: {type: String, required: "{task name} is required!"},
  taskDesc: {type: String, required: "{task description} is required!"},
  taskIcon: {type: String},
  taskType: {type: String, required: true},
  taskBonusDesc: {type: String},
  sortIndex: {type: Number, default: 255},
  progress: {type: Number, default: 0},
  progressDesc: String,
  taskActivated: {type: Boolean, default: false},
  taskFinished: {type: Boolean, default: false},
  bonusDelivered: {type: Boolean, default: false},
  autoRemoveAt: {type: Date, expires: 0},
  taskProcessor: String,
  taskTrigger: String,
  enabled: {type: Boolean, default: true},
  taskData: {type: Schema.Types.Mixed, default: {_placeholder:0}},
  taskDefUpdatedAt: {type: Date},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}

}, {
  collection: 'user_tasks'
});


var __toParams = function(model, excludeAttrs) {
  var transObj = {
    userId: 0,
    taskId: model.taskId,
    taskName: model.taskName,
    taskDesc: model.taskDesc,
    taskIcon: model.taskIcon,
    taskType: model.taskType,
    taskActivated: (model.taskActivated? 1 : 0),
    taskFinished: (model.taskFinished? 1 : 0),
    taskBonusDesc: model.taskBonusDesc,
    progress: model.progress,
    bonusDelivered: model.bonusDelivered
  };

  if (!!model.user_id || !!model.user_id.userId) {
    transObj.userId = model.user_id.user_id;
  }

  if (!!excludeAttrs) {
    for (var index=0; index<excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

userTaskSchema.statics.toParams = __toParams;

userTaskSchema.methods.toParams = function(excludeAttrs) {
  return __toParams(this, excludeAttrs);
};

userTaskSchema.statics.findByUserIdQ = function(userId, onlyActivated) {
  return User.findOneQ({userId: userId})
    .then(function(user) {
      console.log('[UserTask.findByUserIdQ] user: ', user);

      return UserTask.find({user_id: user.id})
        .sort('sortIndex')
        .populate('user_id')
        .execQ();
    })
    .fail(function(err) {
      console.error('[UserTask.findByUserIdQ] error: ', err);
      return null;
    });

};

userTaskSchema.statics.createUserTask = function(user, taskDef) {
  var userTask = new this(taskDef);
  userTask._id = new mongoose.Types.ObjectId();
  userTask.user_id = user.id;
  userTask.task_id = taskDef.id;
  userTask.taskActivated = true;
  userTask.taskDefUpdatedAt = taskDef.updated_at;
  userTask.created_at = Date.now();
  userTask.updated_at = Date.now();
  return userTask;
};

var UserTask = mongoose.model('UserTask', userTaskSchema);

module.exports = UserTask;