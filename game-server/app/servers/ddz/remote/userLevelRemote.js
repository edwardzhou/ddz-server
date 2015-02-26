/**
 * Created by jeffcao on 15/2/26.
 */
/**
 * Created by jeffcao on 15/2/26.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var userLevelService = require('../../../services/userLevelService');
var format = require('util').format;
var utils = require('../../../util/utils');
var ErrorCode = require('../../../consts/errorCode');
var Result = require('../../../domain/result');

module.exports = function(app) {
    return new UserLevelRemote(app);
};

/**
 * 玩家级别远程接口
 * @param app
 * @constructor
 */
var UserLevelRemote = function(app) {
    this.app = app;
};

var remoteHandler = UserLevelRemote.prototype;


remoteHandler.reloadLevelConfig = function(msg, cb) {
    userLevelService.reloadLevelConfig(cb);
};