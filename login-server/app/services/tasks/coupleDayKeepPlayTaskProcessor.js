/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');
var oneDayMillSeconds = 3600 * 24  * 1000;

var coupleDayKeepPlayTaskProcessor = function(opts) {

};

coupleDayKeepPlayTaskProcessor.process = function(task, params) {
    var user = params.user;
    var trigger = params.trigger;
    var count_per_day = params.count;
    logger.info('coupleDayKeepPlayTaskProcessor.process, user=', user.userId);
    if (task.user_id != user.id)
        return false;

    if (!task.taskActivated)
        return false;

    if (task.taskTrigger != trigger)
        return false;

    if (task.taskData.count_per_day != count_per_day)
        return false;

    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    var diff_time = today.getTime() - task.taskData.last_win_date;
    if (diff_time > oneDayMillSeconds*(task.taskData.count - 1)) {
        if (isWinner) {
            task.taskData.current = 1;
        }else {
            task.taskData.current = 0;
        }
    }
    else {
        if (isWinner) {
            task.taskData.current = task.taskData.current + 1;
        }else {
            task.taskData.current = 0;
        }
    }
    if (task.taskData.count <= task.taskData.current) {
        task.taskData.current = task.taskData.count;
        task.taskFinished = true;
    }
    task.taskData.last_win_date = today.getTime();
    task.progress = Math.round(task.taskData.current*100/task.taskData.count);
    task.progressDesc = task.taskData.current + ' / ' + task.taskData.count;
    task.markModified('taskData');
    task.saveQ()
        .then(function(_task) {
            logger.info('[coupleDayKeepPlayTaskProcessor.process] task updated: ', _task.taskDesc);
        });
    return true;
};

module.exports = coupleDayKeepPlayTaskProcessor;