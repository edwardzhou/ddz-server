/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var BaseRoomService = require('./baseRoomService');
var util = require('util');

var NormalRoomService = function(theApp) {
  BaseRoomService.call(this, theApp);
  this.clazzName = 'NormalRoomService';
};

util.inherits(NormalRoomService, BaseRoomService);

module.exports = NormalRoomService;