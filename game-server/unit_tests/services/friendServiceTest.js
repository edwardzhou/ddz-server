/**
 * Created by jeffcao on 15/4/29.
 */
var foo = function(arg1, arg2)  {
    console.log(arg1, arg2);
};

var bar = function(callback) {
    callback(3);
};

cb = function(err, obj) {
    console.log('err => ', err);
    console.log('obj => ', obj);
    lastErr = err;
    lastObj = obj;
};

mongoose = require('mongoose');
mongoose.connect('mongodb://dev2/new_ddz_dev');
console.log('after connected');

//UserId = require('./app/domain/userId');

mongoose.connections[0].on('error', cb);

User = require('../../app/domain/user');
DdzProfile = require('../../app/domain/ddzProfile');
userDao = require('../../app/dao/userDao');
UserSession = require('../../app/domain/userSession');
GameRoom = require('../../app/domain/gameRoom');
MyMessageBox = require('../../app/domain/myMessageBox');
Card = require('../../app/domain/card');
FriendService = require('../../app/services/friendService');

results = {};

function addFriend_test(){
    FriendService.addFriend(54530, 54531, "hello,it's me.");
}

function replyAddFriendMsg_yes_test(){
    FriendService.replyAddFriendMsg(54531, 54530, true);
}

function replyAddFriendMsg_no_test(){
    FriendService.replyAddFriendMsg(54531, 54530, false);
}

function getMyMessageBox_test(){
    var return_msg_box = {addFriendMsgs: []};
    MyMessageBox.findOneQ({userId: 54531})
        .then(function(msg_box){
            return_msg_box.addFriendMsgs = [];
            msg_box.addFriendMsgs.forEach(function(msg){
                if (msg.status == 0){
                    return_msg_box.addFriendMsgs.push(JSON.parse(JSON.stringify(msg)));
                    msg.status = 1;
                }
            });
            msg_box.markModified('addFriendMsgs');
            return msg_box.saveQ();

        })
        .then(function(){
            console.log("getMyMessageBox_test. done. myMsgBox:", return_msg_box);
            //utils.invokeCallback(next, null, {result: true, myMsgBox: return_msg_box});
        })
        .fail(function(error){
            console.log("getMyMessageBox_test. failed. error: ", error);
            //utils.invokeCallback(next, null, {err: errCode, result: false});
        })
}

//addFriend_test();
//replyAddFriendMsg_yes_test();
//replyAddFriendMsg_no_test();
//getMyMessageBox_test();