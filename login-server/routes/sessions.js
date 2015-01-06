/**
 * Created by edwardzhou on 15/1/5.
 */

var express = require('express');
var router = express.Router();

var AppSignature = require('../app/domain/appSignature');
var User = require('../app/domain/user');
var UserSession = require('../app/domain/userSession');
var DdzProfile = require('../app/domain/ddzProfile');

var doLogin = function(req, res) {

  var userId = req.param('uid');
  console.log('userId: ', userId);

  AppSignature.findOneQ()
    .then(function(appSign) {
      console.info('AppSignature: ', appSign);
    })
    .fail(function(err) {
      console.error('Error:', err);
    })
  res.send('respond with a resource');
};

/* GET users listing. */
router.get('/new', doLogin)
  .post('/new', doLogin);

module.exports = router;
