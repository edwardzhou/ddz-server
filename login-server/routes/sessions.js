/**
 * Created by edwardzhou on 15/1/5.
 */

var express = require('express');
var router = express.Router();

var AppSignature = require('../app/domain/appSignature');
var User = require('../app/domain/user');
var UserSession = require('../app/domain/userSession');
var DdzProfile = require('../app/domain/ddzProfile');
var AppServerInfo = require('../app/domain/appServerInfo');
var Result = require('../app/domain/result');
var ErrorCode = require('../app/consts/errorCode');

var utils = require('../app/util/utils');

var userService = require('../app/services/userService');
var taskService = require('../app/services/taskService');
var appSignatureService = require('../app/services/appSignatureService');

var Q = require('q');
var signUpQ = Q.nbind(userService.signUp, userService);
var signInByAuthTokenQ = Q.nbind(userService.signInByAuthToken, userService);
var signInByPasswordQ = Q.nbind(userService.signInByPassword, userService);

var verifyEncryptedDataQ = Q.nbind(appSignatureService.verifyEncryptedData, appSignatureService);

var doLogin = function(req, res) {

  var userId = req.param('uid');
  console.log('userId: ', userId);

  AppSignature.findOneQ()
    .then(function(appSign) {
      console.info('AppSignature: ', appSign);
    })
    .fail(function(err) {
      console.error('Error:', err);
    });

  utils.invokeCallback(function(){console.info('invoke utils.invokeCallback')}, null, null);

  res.send('respond with a resource');
};

var doLoginPost = function(req, res) {
  var params = JSON.parse( new Buffer(req.body.p, 'base64').toString() );
  var sign_md5 = req.body.s;
  var app_sign_key = req.body.a;
  console.log('params: ', params);

  var appPkgName = params.appPkgName;
  var appResVersion = params.appResVersion;
  var appVersionName = params.appVersionName;
  var appVersionCode = params.appVersionCode;
  var appAffiliate = params.appAffiliate;
  var appChannel = params.appChannel;
  var tm = params.tm;
  var userId = params.userId;

  var loginInfo = {};
  loginInfo.userId = params.userId;
  loginInfo.signInType = params.signInType;
  loginInfo.authToken = params.authToken;
  loginInfo.handset = params.handsetInfo;
  loginInfo.frontendId = "";
  loginInfo.frontendSessionId = 0;

  var password = params.password;
  // 密码解密
  // ...
  loginInfo.password = password;

  var results = null;

  AppSignature.findOneQ({subjectMD5: app_sign_key})
    .then(function(appSign) {
      console.info('AppSignature: ', appSign);
      if (appSign == null) {
        throw Result.genError(1000, 0, '无效签名');
      }

    })
    .then( function() {
      //return signInByAuthTokenQ(loginInfo);
      if (userId == null) {
        return signUpQ(loginInfo);
      }
      else if (!!loginInfo.password) {
        return signInByPasswordQ(loginInfo);
      } else {
        return signInByAuthTokenQ(loginInfo);
      }
    })
    .then(function(signResult){
      results = signResult;
      return AppServerInfo.findOneQ({appPkgName: appPkgName});
    })
    .then(function(appServerInfo){
      results.serverInfo = {
        gameServers: appServerInfo.get('gameServers'),
        updateVersionUrl: appServerInfo.updateVersionUrl,
        updateManifestUrl: appServerInfo.updateManifestUrl,
        updatePackageUrl: appServerInfo.updatePackageUrl
      }
    })
    .then(function() {
      var resp = {};
      resp.errCode = 0; // SUCCESS
      resp.user = results.user.toParams({exclude:['ddzLoginRewards']});
      resp.sessionToken = results.userSession.sessionToken;
      resp.sk = results.userSession.sessionKK;
      var len = results.serverInfo.gameServers.length;
      resp.serverInfo = results.serverInfo.gameServers[resp.user.userId % len];
      resp.updateVersionUrl = results.serverInfo.updateVersionUrl;
      resp.updateManifestUrl = results.serverInfo.updateManifestUrl;
      resp.updatePackageUrl = results.serverInfo.updatePackageUrl;
      taskService.fixUserTaskList(results.user);

      console.info('[doLoginPost] resp: ', resp);
      res.end(JSON.stringify(resp));
    })
    .fail(function(err) {
      console.error('[doLoginPost] Error: ', err);
      var resp = {};
      resp.errCode = err.errCode || err.err || ErrorCode.SYSTEM_ERROR;
      resp.error = err;
      resp.message = ErrorCode.getErrorMessage(resp.errCode);
      res.end(JSON.stringify(resp));
    });



  res.writeContinue();
};


/* GET users listing. */
router.get('/new', doLogin)
  .post('/new', doLoginPost);

module.exports = router;
