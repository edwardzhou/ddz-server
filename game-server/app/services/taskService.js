/**
 * Created by edwardzhou on 14/12/6.
 */

var User = require('../domain/user');
var UserSession = require('../domain/userSession');
var TaskDef = require('../domain/taskDef');
var UserTask = require('../domain/userTask');
var ErrorCode = require('../consts/errorCode');
var utils = require('../util/utils');

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

};