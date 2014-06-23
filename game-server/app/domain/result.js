var Result = function(retCode, subCode, message) {
  this.retCode = retCode;
  this.subCode = subCode || 0;
  this.message = message || '';
};

module.exports = Result;