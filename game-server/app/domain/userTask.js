/**
 * Created by edwardzhou on 14/12/4.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var uuid = require('node-uuid');
var utils = require('../util/utils');

/**
 * 任务定义
 * @type {Mongoose.Schema}
 */
var userTaskSchema = new mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  task_id: {type: mongoose.Schema.Types.ObjectId, ref: 'TaskDef'},
  taskName: {type: String, required: "{task name} is required!"},
  taskDesc: {type: String, required: "{task description} is required!"},
  taskIcon: {type: String},
  taskType: {type: String, required: true},
  sortIndex: {type: Number, default: 255},
  progress: {type: Number, default: 0},
  enabled: {type: Boolean, default: true},
  taskData: {type: Schema.Types.Mixed, default: {_placeholder:0}},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}

}, {
  collection: 'user_tasks'
});

var UserTask = mongoose.Model('UserTask', userTaskSchema);

module.exports = UserTask;