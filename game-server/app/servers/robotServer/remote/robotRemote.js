/**
 * Created by jeffcao on 15/4/1.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var robotService = require('../../../services/robotService');
var format = require('util').format;
var utils = require('../../../util/utils');
var ErrorCode = require('../../../consts/errorCode');
var Result = require('../../../domain/result');

module.exports = function(app) {
    return new RobotRemote(app);
};

/**
 * 玩家级别远程接口
 * @param app
 * @constructor
 */
var RobotRemote = function(app) {
    this.app = app;
    //this.robotService = app.get('robotService');
};

var remoteHandler = RobotRemote.prototype;


remoteHandler.reloadAllRobots = function(msg, cb) {
    logger.info('remoteHandler.reloadAllRobots');
    robotService.reloadAllRobots();
};



remoteHandler.idelRobotsCount = function(msg, cb) {
    logger.info('remoteHandler.idelRobotsCount');
    //logger.info('remoteHandler.idelRobotsCount, cb=', cb);
    var idle_count = robotService.idelRobotsCount();
    logger.info('remoteHandler.idelRobotsCount. idle_count=', idle_count);
    utils.invokeCallback(cb, null, idle_count);
};

remoteHandler.getRobotPlayers = function(robots_count, cb) {
    logger.info("[remoteHandler.getRobotPlayers]");
    var robotPlayers = robotService.getRobotPlayers(robots_count);
    utils.invokeCallback(cb, null, robotPlayers);
};

remoteHandler.releaseRobotPlayers = function(robot_players, cb) {
    logger.info("[remoteHandler.releaseRobotPlayers]");
    robotService.releaseRobotPlayers(robot_players);
    //utils.invokeCallback(cb, null, null);
};