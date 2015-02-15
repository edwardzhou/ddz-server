/**
 * Created by jeffcao on 15/2/10.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var oneDayWinSprintTaskProcessor = function(opts) {

};

oneDayWinSprintTaskProcessor.process = function(task, params) {
    var user = params.user;
    var trigger = params.trigger;
    var isWinner = params.isWinner;
    var isSpring = params.isSpring;
    var pokeGame = params.pokeGame;
    logger.info('oneDayWinSprintTaskProcessor.process, user=, isWinner=', user.userId, isWinner);
    if (task.user_id != user.id)
        return false;

    if (!task.taskActivated)
        return false;

    if (task.taskTrigger != trigger)
        return false;

    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    var diff_time = today.getTime() - task.taskData.last_win_date;
    if (diff_time != 0) {
        if (isWinner && isSpring) {
            task.taskData.current = 1;
        }else {
            task.taskData.current = 0;
        }
    }
    else {
        if (isWinner && isSpring) {
            task.taskData.current = task.taskData.current + 1;
        }else {
            if (task.taskData.current > 0) {
                task.taskData.current = task.taskData.current - 1;
            }
        }
    }

    if (task.taskData.count <= task.taskData.current) {
        task.taskData.current = task.taskData.count;
        task.taskFinished = true;
    }

    task.taskData.last_win_date = today.getTime();
    task.progressDesc = task.taskData.current + ' / ' + task.taskData.count;
    task.progress = Math.round(task.taskData.current*100/task.taskData.count);
    task.markModified('taskData');
    task.saveQ()
        .then(function(_task) {
            logger.info('[oneDayWinSprintTaskProcessor.process] task updated: ', _task);
        });
    return true;
};

module.exports = oneDayWinSprintTaskProcessor;