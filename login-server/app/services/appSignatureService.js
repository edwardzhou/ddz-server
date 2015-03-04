/**
 * Created by edwardzhou on 15/1/6.
 */

var logger = require('pomelo-logger').getLogger(__filename);
var User = require('../domain/user');
var AppSignature = require('../domain/appSignature');
var crypto = require('crypto');
var xxtea = require('../util/xxtea');
var utils = require('../util/utils');
var ErrorCode = require('../consts/errorCode');
var Result = require('../domain/result');
var Q = require('q');

var pomeloApp = null;
var AppSignatureService = module.exports;

AppSignatureService.init = function (app, opts) {
  pomeloApp = app;
};

var genError = function (errCode) {
  var error = new Error();
  error.errCode = errCode;
  return error;
};

AppSignatureService.verifyAppSign = function (subjectMD5, data, dataMD5, cb) {
  AppSignature.findOneQ({subjectMD5: subjectMD5})
    .then(function(appSign) {
      if (appSign == null) {
        var error = new Error('Connection invalid.');
        error.result = new Result(ErrorCode.CONNECTION_HANDSAKE_INVALID, 0, 'Connection invalid.');
        throw error;
      }

      var signMD5 = appSign.signatureMD5;
      var encryptedArray = xxtea.encryptToArray(data, signMD5);
      var encryptedData = xxtea.longArrayToBuffer(encryptedArray, false);
      var encryptedBase64 = encryptedData.toString('base64');
      var encryptedMD5 = crypto.createHash('md5').update(encryptedBase64).digest('hex');

      if (encryptedMD5 != dataMD5) {
        logger.error('[AppSignatureService.verifyAppSignQ] dataMD5 "%s" not match with "%s"', dataMD5, encryptedMD5);
        var error = new Error('Connection invalid.');
        error.result = new Result(ErrorCode.CONNECTION_HANDSAKE_INVALID, 0, 'Connection invalid.');
        throw error;
      }
      utils.invokeCallback(cb, null, true);
    })
    .fail(function(err){
      utils.invokeCallback(cb, err, null);
    });
};


AppSignatureService.verifyEncryptedData = function(subjectMD5, data, dataMD5, cb) {
  AppSignature.findOneQ({subjectMD5: subjectMD5})
    .then(function(appSign) {
      var error = null;
      if (appSign == null) {
        error = Result.genErrorResult(ErrorCode.CONNECTION_HANDSAKE_INVALID, 0, 'invalid sign key.');
        throw error;
      }

      var signMD5 = appSign.signatureMD5;
      var debase64Data = new Buffer(data, 'base64');
      var dataArray = xxtea.bufferToLongArray(debase64Data, false);
      var decryptedArray = xxtea.decryptToArray(dataArray, signMD5);
      var decryptedBuffer = xxtea.longArrayToBuffer(decryptedArray, true);
      var decryptedData = decryptedBuffer.toString();
      var decryptedDataMD5 = crypto.createHash('md5').update(decryptedData + signMD5).digest('hex');

      if (decryptedDataMD5 != dataMD5) {
        logger.error('[AppSignatureService.verifyEncryptedData] dataMD5 "%s" not match with "%s"', dataMD5, decryptedDataMD5);
        error = Result.genErrorResult(ErrorCode.CONNECTION_HANDSAKE_INVALID, 0, 'Connection invalid.');
        throw error;
      }
      utils.invokeCallback(cb, null, {appSign: appSign, data: decryptedData});
    })
    .fail(function(err){
      utils.invokeCallback(cb, err, null);
    });
};
