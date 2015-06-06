/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var Result = function(retCode, subCode, message) {
  this.retCode = retCode; // default Success
  this.subCode = subCode || 0;
  this.message = message || '';
};

Result.genErrorResult = function(retCode, subCode, message) {
  var result = new Result(retCode, subCode, message);
  var error = new Error(message);
  error.result = result;
  error.errCode = retCode;
  return error;
};

module.exports = Result;