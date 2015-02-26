/**
 * Created by edwardzhou on 14/12/6.
 */

var format = require('util').format;
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var Result = require('../../../domain/result');
var User = require('../../../domain/user');
var DdzGoodsPackage = require('../../../domain/ddzGoodsPackage');
var messageService = require('../../../services/messageService');

var taskService = require('../../../services/taskService');
var userService = require('../../../services/userService');
var userLevelService = require('../../../services/userLevelService');
var ddzGoodsPackageService = require('../../../services/ddzGoodsPackageService');


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
 * 获取已完成任务数
 * @param msg
 * @param session
 * @param next
 */
Handler.prototype.getFinishedTasksCount = function (msg, session, next) {
  var userId = session.uid;
  User.findOneQ({userId: userId})
      .then(function(user) {
        logger.info('[taskHandler.getTasks] user => ', user);
        taskService.getFinishedTaskListQ(user)
            .then(function(tasks) {
              utils.invokeCallback(next, null, {count: tasks.length});
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
  var userId = session.uid;
  var taskId = msg.taskId;

  var user, userTask;
  var coinsChanged = false;
  User.findOne({userId: userId})
    .populate('ddzProfile')
    .execQ()
    .then(function(_user) {
      user = _user;
      return taskService.getUserTaskQ(user, taskId);
    })
    .then(function(_task) {
      userTask = _task;
      if (!!userTask && userTask.taskFinished) {
        if (userTask.taskData.bonusType == "coins") {
          user.ddzProfile.coins += userTask.taskData.bonus;
          //user.ddzProfile.levelName =  this.app.rpc.userSystem.userRemote.getUserLevelName(user.ddzProfile.coins);
          user.ddzProfile.save();
          coinsChanged = true;
        }
        else if (userTask.taskData.bonusType == "ddz_good") {
          ddzGoodsPackageService.doAddTaskGoodToAsset(user, userTask.taskData.bonus_id, userTask.taskData.bonus_count);
        }
        var today = new Date();
        today.setHours(23);
        today.setMinutes(59);
        today.setSeconds(59);
        today.setMilliseconds(0);

        var userParams = user.toParams(['authToken', 'lastSignedInTime']);
        messageService.pushMessage('onUserInfoUpdate', {user: userParams}, [{uid: userId, sid: session.frontendId}]);
        userTask.bonusDelivered = true;
        userTask.autoRemoveAt = today.getTime();
        userTask.saveQ()
          .then(function(){
            taskService.fixUserTaskList(user);
          });

      }
    })
    .then(function(){
        if (coinsChanged) {
          userLevelService.onUserCoinsChanged(userId, true);
        }
      utils.invokeCallback(next, null, {result: true});
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
Handler.prototype.getOneDayPlayTaskInfo = function (msg, session, next) {
  var userId = session.uid;
  var user, userTask;

  User.findOneQ({userId: userId})
      .then(function(_user) {
        user = _user;
        return taskService.getOneDayPlayUserTasksQ(user);
      })
      .then(function(_tasks) {
        userTask = null;
        if (_tasks != null){
          userTask = _tasks[0];
        }
        var result_info = {};
        if (userTask == null){
          result_info = {current: 60, count: 60};
        }
        else {
          result_info = {current: userTask.taskData.current, count: userTask.taskData.count};
        }
        utils.invokeCallback(next, null, {result: true, task_info: result_info} );
      })
      .fail(function(err) {
        logger.error('[TaskHandler.getOneDayPlayTaskInfo] error: ', err);
        utils.invokeCallback(next, null, {result: false, err: err});
      })
};

