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

var allRobotsMap = {};
var idleRobots = [];

RobotService.init = function(app) {
    logger.info("robotService init.");
    pomeloApp = app;
    Users.findQ({robot:true})
        .then(function(users){
            for (var index=0; index<users.length; index++) {
                var robotPlayer = new Player(users[index]);
                allRobotsMap[robotPlayer.id] = robotPlayer;
                idleRobots.push(robotPlayer);
            }
            logger.info('RobotService.init, idleRobots.length=', idleRobots.length);
        })
        .fail(function(error){
            logger.error('RobotService.init failed.', error);
        });
};

RobotService.idelRobotsCount = function() {
    return idleRobots.length;
}

RobotService.getRobotPlayers = function(robots_count) {
    logger.info("[RobotService.getRobotPlayers]");
    logger.info("[RobotService.getRobotPlayers], idleRobots.length=", idleRobots.length);
    var robotPlayers = [];
    if (idleRobots.length >= robots_count) {
        robotPlayers = idleRobots.splice(0, robots_count);
    }
    else {
        robotPlayers = idleRobots.splice();
    }
    for(var i=0;i<robotPlayers.length;i++){
        allRobotsMap[robotPlayers[i].id] = null;
    }
    logger.info("[RobotService.getRobotPlayers], idleRobots.length=", idleRobots.length);
    return robotPlayers
};

RobotService.releaseRobotPlayers = function(robot_players) {
    logger.info("[RobotService.releaseRobotPlayers]");
    logger.info("[RobotService.releaseRobotPlayers], robot_players.length=", robot_players.length);
    logger.info("[RobotService.releaseRobotPlayers], idleRobots.length=", idleRobots.length);

    for (var i=0;i<robot_players.length;i++) {
        logger.info("[RobotService.releaseRobotPlayers], allRobotsMap[robot_players[i].id]=", allRobotsMap[robot_players[i].id]);
        if (allRobotsMap[robot_players[i].id] == null) {
            allRobotsMap[robot_players[i].id] = robot_players[i];
            idleRobots.push(robot_players[i]);
        }
        else{
            idleRobots.pop(allRobotsMap[robot_players[i].id]);
            allRobotsMap[robot_players[i].id] = robot_players[i];
            idleRobots.push(robot_players[i]);
        }
    }
    logger.info("[RobotService.releaseRobotPlayers], idleRobots.length=", idleRobots.length);
};


RobotService.reloadAllRobots = function(cb){
    logger.info('RobotService.reloadAllRobots');
    Users.findQ({robot:true})
        .then(function(users){
            allRobotsMap = {};
            idleRobots = [];
            logger.info('RobotService.reloadAllRobots, idleRobots.length=', idleRobots.length);
            for (var index=0; index<users.length; index++) {
                var robotPlayer = new Player(users[index]);
                allRobotsMap[robotPlayer.id] = robotPlayer;
                idleRobots.push(robotPlayer);
            }
            logger.info('RobotService.reloadAllRobots, idleRobots.length=', idleRobots.length);
        })
        .fail(function(error){
            logger.error('RobotService.reloadAllRobots failed.', error);
        });
    utils.invokeCallback(cb, null, null);
};