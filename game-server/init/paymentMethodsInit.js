/**
 * Created by edwardzhou on 14-10-9.
 */

PaymentMethod = require('../app/domain/paymentMethod');
DdzGoodsPackage = require('../app/domain/ddzGoodsPackage');
PackagePayment = require('../app/domain/packagePayment');

initPaymentMethods = function() {
  var pm = new PaymentMethod({
    methodId: 'test',
    methodName: '支付测试',
    description: '用于测试支付'
  });

  var results = {};

  pm.saveQ()
    .then(function(payment) {
      results.pm = payment;
      return DdzGoodsPackage.findQ({})
    })
    .then(function(packages) {
      var funcs = packages.map(function(package) {
        var packagePayment = new PackagePayment();
        packagePayment.package = package;
        packagePayment.paymentMethod = results.pm;
        return packagePayment.saveQ();
      });
      return Q.all(funcs);
    })
    .fail(function(err) {
      console.error(err);
    })
    .done(function() {
      console.log('paymentMethods initialized~');
    });
};