/**
 * Created by jeffcao on 15/3/27.
 */
var logger = require('pomelo-logger').getLogger('pomelo', __filename);
var util = require('util');
var GameRoom = require('../domain/gameRoom');
var Users = require('../domain/user');
var Player = require('../domain/player');
var utils = require('../util/utils');

var RobotService = module.exports;

var allRobots = [];
var idleRobots = [];

RobotService.init = function(app) {
    logger.info("robotService init.");
    pomeloApp = app;
    Users.findQ({robot:true})
        .then(function(users){
            for (var index=0; index<users.length; index++) {
                var robotPlayer = new Player(users[index]);
                allRobots.push(robotPlayer);
                idleRobots.push(robotPlayer);
            }
            logger.info('RobotService.init, allRobots.length=', allRobots.length);
        })
        .fail(function(error){
            logger.error('RobotService.init failed.', error);
        });
};

RobotService.getRobot = function(robots_count) {
    var robotPlayers = [];
    if (idleRobots.length >= robots_count) {
        robotPlayers = idleRobots.splice(0, robots_count);
    }
    else {
        robotPlayers = idleRobots.splice();
    }
    return robotPlayers
};

RobotService.releaseRobot = function(robot_players, cb) {
    logger.info("[RoomService.reloadRooms] reload rooms...");
    for (var roomId in roomsMap) {
        var room = roomsMap[roomId];
        room.reloadFromDb();
    }

    utils.invokeCallback(cb);
};


RobotService.reloadAllRobots = function(cb){
    logger.info('RobotService.reloadAllRobots');
    Users.findQ({robot:true})
        .then(function(users){
            for (var index=0; index<users.length; index++) {
                var robotPlayer = new Player(users[index]);
                allRobots.push(robotPlayer);
                idleRobots.push(robotPlayer);
            }
        })
        .fail(function(error){
            logger.error('RobotService.reloadAllRobots failed.', error);
        });
    utils.invokeCallback(cb, null, null);
};