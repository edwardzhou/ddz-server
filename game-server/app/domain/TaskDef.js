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
var taskDefSchema = new mongoose.Schema({
  taskName: {type: String, required: "{task name} is required!"},
  taskDesc: {type: String, required: "{task description} is required!"},
  taskType: {type: String, required: true},
  taskIcon: {type: String},
  sortIndex: {type: Number, default: 255},
  enabled: {type: Boolean, default: true},
  taskData: {type: Schema.Types.Mixed, default: {_placeholder:0}},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now} // 默认有效时间为一小时

}, {
  collection: 'task_defs'
});

var TaskDef = mongoose.Model('UserTask', taskDefSchema);

module.exports = TaskDef;