/**
 * Created by edwardzhou on 14/12/6.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');

var taskService = require('../../../services/taskService');


module.exports = function (app) {
  return new Handler(app);
};

var Handler = function (app) {
  logger.info("connector.TaskHandler created.");
  this.app = app;
};


/**
 * 获取任务清单
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.getTasks = function (msg, session, next) {
  taskService.getTaskListQ(null)
    .then(function(tasks) {
      utils.invokeCallback(next, null, {tasks: tasks.toParams()});
    })
    .fail(function(err) {
      utils.invokeCallback(next, {err: err}, null);
    });
};


/**
 * 领取任务
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.takeTask = function (msg, session, next) {

};


/**
 * 领取任务奖励
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.takeTaskBonus = function (msg, session, next) {

};