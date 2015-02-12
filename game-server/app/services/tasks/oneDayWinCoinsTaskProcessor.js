/**
 * Created by jeffcao on 15/2/10.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');

var oneDayPlayTaskProcessor = function(opts) {

};

oneDayPlayTaskProcessor.process = function(task, params) {
    var user = params.user;
    var trigger = params.trigger;
    var isWinner = params.isWinner;
    var coins = params.coins;
    var pokeGame = params.pokeGame;
    logger.info('oneDayPlayTaskProcessor.process, user=, isWinner=', user.userId, isWinner);
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
        if (isWinner) {
            task.taskData.current = coins;
        }else {
            task.taskData.current = -coins;
        }
    }
    else {
        if (isWinner) {
            task.taskData.current = task.taskData.current + coins;
        }else {
            task.taskData.current = task.taskData.current - coins;
        }
    }

    if (task.taskData.count <= task.taskData.current) {
        task.taskData.current = task.taskData.count;
        task.taskFinished = true;
    }

    task.taskData.last_win_date = today.getTime();
    task.progressDesc = task.taskData.current + ' / ' + task.taskData.count;
    task.markModified('taskData');
    task.saveQ()
        .then(function(_task) {
            logger.info('[oneDayPlayTaskProcessor.process] task updated: ', _task);
        });
    return true;
};

module.exports = oneDayPlayTaskProcessor;