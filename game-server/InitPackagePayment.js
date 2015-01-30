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


CreateGoodsPackagePayment('54362f6d60e2ef89819339e7');