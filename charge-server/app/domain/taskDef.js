/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var uuid = require('node-uuid');
var utils = require('../util/utils');
var DomainUtils = require("./domainUtils");

/**
 * 任务定义
 * @type {Mongoose.Schema}
 */
var taskDefSchema = new mongoose.Schema({
  taskId: {type: String, required: "{task id} is required!"},
  taskName: {type: String, required: "{task name} is required!"},
  taskDesc: {type: String, required: "{task description} is required!"},
  taskType: {type: String, required: true},
  taskIcon: {type: String},
  taskBonusDesc: {type: String},
  sortIndex: {type: Number, default: 255},
  enabled: {type: Boolean, default: true},
  progress: {type: Number, default: 0},
  progressDesc: String,
  taskProcessor: String,
  taskTrigger: String,
  taskData: {type: Schema.Types.Mixed, default: {_placeholder:0}},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'task_defs'
});


var __toParams = function(model, opts) {
  var transObj = {
    userId: 0,
    taskId: model.taskId,
    taskName: model.taskName,
    taskDesc: model.taskDesc,
    taskIcon: model.taskIcon,
    taskType: model.taskType,
    taskBonusDesc: model.taskBonusDesc,
    progress: model.progress,
    progressDesc: model.progressDesc
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

taskDefSchema.statics.toParams = __toParams;

taskDefSchema.methods.toParams = function(opts) {
  return __toParams(this, opts);
};


var TaskDef = mongoose.model('TaskDef', taskDefSchema);

module.exports = TaskDef;