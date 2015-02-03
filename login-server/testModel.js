/**
 * Created by jeffcao on 15/1/30.
 */
/**
 * Created by jeffcao on 15/1/21.
 */
var Q = require('q');

cb = function(err, obj) {
    console.log('err => ', err);
    console.log('obj => ', obj);
    lastErr = err;
    lastObj = obj;
};

fs = require('fs');
mongoose = require('mongoose');
mongoose.connect('mongodb://dev2/new_ddz_dev');
console.log('after connected');

rewardTemplate = require('./app/domain/LoginRewardTemplates');

mongoose.connections[0].on('error', cb);

var pkg_map = {};
var pkg_map_keys = [];
TestGetModel = function() {
    console.log('payment TestGetModel');
    rewardTemplate.findQ({})
        .then(function(templates) {
            console.log(templates);
        }).done(function(){
            process.exit(0);
        });

};


TestGetModel();