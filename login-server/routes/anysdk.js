/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var express = require('express');
var router = express.Router();

var User = require('../app/domain/user');
var UserSession = require('../app/domain/userSession');
var DdzProfile = require('../app/domain/ddzProfile');
var AppServerInfo = require('../app/domain/appServerInfo');
var Result = require('../app/domain/result');
var ErrorCode = require('../app/consts/errorCode');

var utils = require('../app/util/utils');

var userService = require('../app/services/userService');


var http = require('http');
var oauth_host = 'oauth.anysdk.com';
var oauth_path = '/api/User/LoginOauth/';

var checkLogin = function(req, res) {
  var rawBody = req.rawBody;
  var options = {
    host: oauth_host,
    path: oauth_path,
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': rawBody.length
    }
  };

  console.log('#post url:\n' + oauth_host + oauth_path);
  console.log('#post data:\n' + rawBody);
  var reqToAnysdk = http.request(options, function(respFromAnysdk) {
    respFromAnysdk.setEncoding('utf-8');
    respFromAnysdk.on('data', function(anysdkData) {
      console.log('#anysdk return data:\n' + anysdkData);
      var respJson = JSON.parse(anysdkData);
      if (!!respJson && (respJson.status == 'ok')) {
        respJson.ext = '登陆验证成功';
        var user_sdk = respJson.common.user_sdk;
        var user_sdk_uid = respJson.common.uid;

        User.findOneQ({"anySDK.user_sdk": user_sdk, "anySDK.uid": user_sdk_uid})
          .then(function(user) {
            respJson.ext = {};
            respJson.ext.result = true
            respJson.ext.user_sdk = respJson.common.user_sdk;
            respJson.ext.uid = respJson.common.uid;
            if (!!user) {
              respJson.ext.userId = user.userId;
              respJson.ext.token = user.authToken;
            }
            res.write(JSON.stringify(respJson));
            res.end();
          })
          .fail(function(err) {
            respJson.ext = {
              result: false,
              error: err
            };
            res.write(JSON.stringify(respJson));
            res.end();
          })
      } else {
        res.write(JSON.stringify(respJson));
        res.end();
      }
    });
  });

  reqToAnysdk.write(rawBody);
  reqToAnysdk.end();
};

router.get('/', checkLogin)
  .post('/', checkLogin);

module.exports = router;
