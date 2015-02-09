/**
 * Created by jeffcao on 15/1/30.
 */
/**
 * Created by jeffcao on 15/1/21.
 */
var Q = require('q');
var utils = require('./app/util/utils');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

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

DdzProfile = require('./app/domain/ddzProfile');
User = require('./app/domain/user');
DdzLoginRewards = require('./app/domain/ddzLoginRewards');

GoodsPackage = require('./app/domain/ddzGoodsPackage');
PackagePayment = require('./app/domain/packagePayment');
PaymentMethod = require('./app/domain/paymentMethod');

mongoose.connections[0].on('error', cb);

var pkg_map = {};
var pkg_map_keys = [];
CreateGoodsPackagePayment = function(pay_methond_id) {
    console.log('payment method id=',pay_methond_id);
    GoodsPackage.findQ({})
        .then(function(pkgs) {
            var funcs = pkgs.map(function(pkg){
                pkg_map[pkg.id] = pkg;
                pkg_map_keys.push(pkg.id);
                query = {package_id:pkg.id, paymentMethod_id:pay_methond_id};
                return PackagePayment.findOneQ(query);
            });
            return Q.all(funcs);
        }).then(function(pkg_pays){
            pkg_pays.forEach(function(pkg_pay){
                if (pkg_pay != null) {
                    //console.log('pkg_pay is no null');
                    pkg_map[pkg_pay.package_id] = null;
                }
            });
            return PaymentMethod.findByIdQ(pay_methond_id);

        }).then(function(payMethond){
            var funcs = pkg_map_keys.map(function(key) {
                if (pkg_map[key] != null) {
                    console.log('cur_pkg is not null');
                    var packagePayment = new PackagePayment();
                    packagePayment.package_id = key;
                    packagePayment.paymentMethod_id = payMethond.id;
                    packagePayment.packageName = pkg_map[key].packageName;
                    packagePayment.description = pkg_map[key].packageDesc;
                    packagePayment.price = pkg_map[key].price;
                    packagePayment.actual_price = pkg_map[key].price;
                    return packagePayment.saveQ();
                }

            });
            return Q.all(funcs);
        }).done(function(){
            process.exit(0);
        });

};


//CreateGoodsPackagePayment('54362f6d60e2ef89819339e7');

testUpdateUserInfo = function(userId) {
    console.log('testUpdateUserInfo, userId=', userId);
    var result = {};
    User.findOne({userId: userId})
        .populate('ddzProfile ddzLoginRewards')
        .execQ()
        .then(function(user){
            console.log('1th then, user.ddzLoginRewards=', user.ddzLoginRewards);
            console.log('1th then, user.ddzProfile=', user.ddzProfile);
            if (user.ddzLoginRewards == null){
                throw genError(ErrorCode.LOGIN_REWARD_NULL);
            }
            result.user = user;
            var rewardCoins = 0;
            for(var i=1;i<=user.ddzLoginRewards.login_days;i++){
                var v_day = 'day_'+i;
                if (user.ddzLoginRewards.reward_detail[v_day]["status"] == 1){
                    rewardCoins = rewardCoins + user.ddzLoginRewards.reward_detail[v_day]["bonus"];
                    user.ddzLoginRewards.reward_detail[v_day]["status"] = 2;
                }
            }
            console.log(' user.ddzLoginRewards=', user.ddzLoginRewards);
            result.rewardCoins = rewardCoins;
            console.log('result.rewardCoins=', result.rewardCoins);
            //var funcs = function(){
            //    console.log('UserService.deliverLoginReward, empty funcs.');
            //};
           var funcs = [];
            if (rewardCoins > 0){
                console.log('rewardCoins > 0');
                user.ddzProfile.coins = user.ddzProfile.coins + rewardCoins;
                user.ddzLoginRewards.markModified('reward_detail');
                var funca = function(){
                    console.log('UserService.deliverLoginReward, save ddzProfile');
                    return user.ddzProfile.saveQ();
                };
                var funcb = function(){
                    console.log('UserService.deliverLoginReward, save  ddzLoginRewards');
                    return user.ddzLoginRewards.saveQ();
                };
                funcs.push(funca());
                funcs.push(funcb());
            }
            console.log('user.ddzProfile=', user.ddzProfile);
            return Q.all(funcs);
        })
        .then(function(){
            console.log('then');
            //utils.invokeCallback(callback, null, result);
        })
        .fail(function(error){
            console.log('fail');
            //utils.invokeCallback(callback, {code: error.number, msg: error.message}, null);
        })
        .done(function(){
            process.exit(0);
        });
};

console.log('call testUpdateUserInfo')
testUpdateUserInfo(50467);