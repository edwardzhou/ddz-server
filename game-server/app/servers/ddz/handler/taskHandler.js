/**
 * Created by edwardzhou on 14/12/6.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
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
  var userId = session.uid;
  User.findOneQ({userId: userId})
    .then(function(user) {
      logger.info('[taskHandler.getTasks] user => ', user);
      taskService.getTaskListQ(user)
        .then(function(tasks) {
          utils.invokeCallback(next, null, {tasks: tasks.toParams()});
        })
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
Handler.prototype.applyTask = function (msg, session, next) {
  var userId = session.uid;
  var taskId = msg.taskId;

  var user, userTask;

  User.findOneQ({userId: userId})
    .then(function(_user) {
      user = _user;
      return taskService.getUserTaskQ(user, taskId);
    })
    .then(function(_task) {
      userTask = _task;
      if (!!userTask) {
        userTask.taskActivated = true;
        userTask.updated_at = Date.now();
        return userTask.saveQ();
      }
    })
    .then(function(){
      utils.invokeCallback(next, null, {task: userTask.toParams()});
    })
    .fail(function(err) {
      logger.error('[TaskHandler.applyTask] error: ', err);
      utils.invokeCallback(next, null, {task: null, err: err});
    })
};


/**
 * 领取任务奖励
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.takeTaskBonus = function (msg, session, next) {

};