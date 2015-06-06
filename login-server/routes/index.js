/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
