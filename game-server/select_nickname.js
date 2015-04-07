/**
 * Created by jeffcao on 15/1/21.
 */
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

//UserId = require('./app/domain/userId');
User = require('./app/domain/user');

mongoose.connections[0].on('error', cb);
var nickNameList;
var robotIndex = 1;

fs.readFile('usernames3.txt', 'utf8', function (err, data) {
    if (err) throw err;
    nickNameList = data.split('\n');
    console.log(nickNameList.length);

});

getNickname = function(user) {
    if (user.robot) {
        console.log('getNickname for userId ', user.userId);
        console.log('getNickname user.nickName ', user.nickName);
        console.log('getNickname robotIndex ', robotIndex);
        console.log('getNickname nickName ', nickNameList[robotIndex]);
        user.nickName = nickNameList[robotIndex];
        user.save();
        robotIndex = robotIndex + 1;
    }
};

selectNickName = function() {
    robotIndex = 1;
    User.findQ({})
        .then(function(users) {
            users.forEach(getNickname);
            //process.exit(0);
        });

};

selectNickName();