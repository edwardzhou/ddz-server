/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var express = require('express');
var router = express.Router();

var http = require('http');
var oauth_host = 'oauth.anysdk.com';
var oauth_path = '/api/User/LoginOauth/'

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
      }

      res.write(JSON.stringify(respJson));
    });
  });

  reqToAnysdk.write(rawBody);
  reqToAnysdk.end();
};

router.get('/', checkLogin)
  .post('/', checkLogin);

module.exports = router;
