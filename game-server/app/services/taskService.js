/**
 * Created by edwardzhou on 14/12/6.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var User = require('../domain/user');
var UserSession = require('../domain/userSession');
var TaskDef = require('../domain/taskDef');
var UserTask = require('../domain/userTask');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');
var UserTask = require('../domain/userTask');

var Q = require('q');

var pomeloApp = null;
var TaskService = module.exports;

TaskService.init = function (app, opts) {
  pomeloApp = app;
};

var genError = function (errCode) {
  var error = new Error();
  error.errCode = errCode;
  return error;
};

TaskService.getTaskListQ = function (user) {
  return UserTask.findByUserIdQ(user.userId);
};

TaskService.getUserTaskQ = function(user, taskId) {
  return UserTask.findOneQ({user_id: user.id, taskId: taskId});
};

TaskService.fixUserTaskList = function (user) {
  var userTasks;
  var taskDefs;

  var getByTaskId = function (tasks, taskId) {
    for (var index = 0; index < tasks.length; index++) {
      if (tasks[index].taskId == taskId)
        return tasks[index];
    }
    return null;
  };

  UserTask.findByUserIdQ(user.userId)
    .then(function (_userTasks) {
      console.log('got user tasks: ', _userTasks);
      userTasks = _userTasks;
      return TaskDef.findQ({});
    })
    .then(function (_taskDefs) {
      console.log('got task defs: ', _taskDefs);
      taskDefs = _taskDefs;
    })
    .then(function () {
      var userTask;
      var taskDef;
      for (var index = 0; index < taskDefs.length; index++) {
        taskDef = taskDefs[index];
        console.log('check task def: ', taskDef);
        userTask = getByTaskId(userTasks, taskDef.taskId);
        if (userTask == null) {
          if (taskDef.enabled) {
            console.info('taskId is not exists, create new user task.');
            userTask = UserTask.createUserTask(user, taskDef);
            userTask.save();
          }
        } else if (!userTask.taskActivated) {
          if (taskDef.enabled) {
            if (taskDef.updated_at > userTask.taskDefUpdatedAt) {
              console.info('userTask need to be updated.');
              userTask.remove();
              userTask = UserTask.createUserTask(user, taskDef);
              userTask.save();
            }
          } else {
            console.info('userTask need to be remove due to taskDef disabled.');
            userTask.remove();
          }
        }
      }
    })
    .fail(function (err) {
      console.error('[TaskService.fixUserTaskList] error: ', err);
    });
};

TaskService.processGamingTasks = function(user, isWinner, pokeGame) {
  logger.info('[TaskService.processGamingTasks] user: ', user);
  UserTask.findQ({user_id: user.id, taskActivated: true, taskFinished: false})
    .then(function(_tasks){
      logger.info('[TaskService.processGamingTasks] _tasks: ', _tasks);
      for(var index=0; index<_tasks.length; index++) {
        TaskService.processTask(_tasks[index], {user: user, isWinner: isWinner, pokeGame: pokeGame});
      }
    })
    .fail(function(err) {
      logger.error('[TaskService.processGamingTasks] user => ', user, '\n Error: ', err);
    })
};

TaskService.processTask = function(task, params) {
  logger.info('[TaskService.processTask] task: ', task);
  if (!!task.taskData.roomId && task.taskData.roomId != params.pokeGame.roomId)
    return;

  task.taskData.current = task.taskData.current + 1;
  task.progressDesc = task.taskData.current + ' / ' + task.taskData.count;
  if (task.taskData.current >= task.taskData.count ) {
    task.taskFinished = true;
  }
  task.markModified('taskData');
  task.save();
};