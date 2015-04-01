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
    this.robotService = app.get('robotService');
};

var remoteHandler = RobotRemote.prototype;


remoteHandler.reloadAllRobots = function(msg, cb) {
    logger.info('remoteHandler.reloadAllRobots');
    this.robotService.reloadAllRobots(cb);
};