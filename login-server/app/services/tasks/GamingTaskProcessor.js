/**
 * Created by edwardzhou on 14/12/25.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var GamingTaskProcessor = function(opts) {

};

GamingTaskProcessor.process = function(task, params) {
  var user = params.user;
  var trigger = params.trigger;
  var isWinner = params.isWinner;
  var pokeGame = params.pokeGame;

  if (task.user_id != user.id)
    return false;

  if (!task.taskActivated)
    return false;

  if (task.taskTrigger != trigger)
    return false;

  if (!!task.taskData.roomId && task.taskData.roomId != pokeGame.roomId)
    return false;

  task.taskData.current ++;
  if (task.taskData.count <= task.taskData.current) {
    task.taskData.current = task.taskData.count;
    task.taskFinished = true;
  }
  task.progressDesc = task.taskData.current + ' / ' + task.taskData.count;
  task.progress = Math.round(task.taskData.current*100/task.taskData.count);
  task.markModified('taskData');
  task.saveQ()
    .then(function(_task) {
      logger.info('[GamingTaskProcessor.process] task updated: ', _task);
    });
  return true;
};

module.exports = GamingTaskProcessor;