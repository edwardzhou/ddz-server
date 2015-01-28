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
GoodsPackage = require('./app/domain/ddzGoodsPackage');
PackagePayment = require('./app/domain/packagePayment');

mongoose.connections[0].on('error', cb);
var nickNameList;
var robotIndex = 1;

fs.readFile('usernames2.txt', 'utf8', function (err, data) {
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
            process.exit(0);
        });

};

CreateGoodsPackagePayment = function(pay_methond_id) {
    console.log('payment method id, id=',pay_methond_id);
     GoodsPackage.findQ({})
        .then(function(pkgs) {
             console.log('pkgs.length=',pkgs.length);
             pkgs.forEach(function(pkg){
                 query = {package_id:pkg.id, paymentMethod_id:pay_methond_id};
                 //console.log('packagePayment, query=', query);
                 return PackagePayment.findOneQ(query);
             });
             process.exit(0);
        }).then(function(pkg_pay){
             console.log('pkg_pay',pkg_pay);
         });

};

CreateGoodsPackagePayment12 = function(pay_methond_id) {
    console.log('payment method id, id=', pay_methond_id)

    query = {package_id: '54c727316a6566a1de270001', paymentMethod_id: pay_methond_id};
    //console.log('packagePayment, query=', query);
    PackagePayment.findQ(query)
        .then(function (result_set) {
            console.log('result_set.length=', result_set.length);
            process.exit(0);
        });

};

//selectNickName();

CreateGoodsPackagePayment('54362f6d60e2ef89819339e7');