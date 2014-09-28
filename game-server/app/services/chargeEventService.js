/**
 * Created by edwardzhou on 14-9-5.
 */

var pomeloApp = null;
var sessionService = null;
var getSessionBySidQ = null;
var msgService = require('./messageService');
var pushMessageQ = null;

var PubSubEvent = require('../domain/pubSubEvent');
var PurchaseOrder = require('../domain/purchaseOrder');
var UserSession = require('../domain/userSession');
var DdzGoodsPackageService = require('./ddzGoodsPackageService');
var Q = require('q');

var ChargeEventService = function() {

};

ChargeEventService.init = function(app, opts) {
  pomeloApp = app;

  setTimeout(function(){
    var subs = PubSubEvent.find({eventName: 'charge', active: 1})
      .tailable({awaitdata:true})
      .setOptions({numberOfRetries: 10000000})
      .stream()
      .on('data', ChargeEventService.onChargeEvent)
      .on('close', function(){
        console.log('[ChargeEventService] event tail stream closed');
      })
      .on('error', function(err) {
        console.error('[ChargeEventService] event tail stream error: ', err);
      });
    console.log('start to subscribe charge events.');
  }, 3000);
};

ChargeEventService.onChargeEvent = function(event) {

  if (sessionService == null) {
    sessionService = pomeloApp.get('backendSessionService');
    //msgService = pomeloApp.get('messageService');
    getSessionBySidQ = Q.nbind(sessionService.get, sessionService);
    pushMessageQ = Q.nbind(msgService.pushMessage, msgService);
  }

  event.active = 0;
  var orderId = event.eventData.orderId;
  var userId = event.eventData.userId;
  var user = null;
  var purchaseOrder = null;
  var userSession = null;

  event.saveQ()
//    .then(function() {
//      return User.findOne({userId: userId})
//        .populate('ddzProfile')
//        .execQ();
//    })
//    .then(function(u) {
//      user = u;
//    })
    .then(function(){
      return PurchaseOrder.findOneQ({orderId: orderId});
    })
    .then(function(po) {
      purchaseOrder = po;
      return DdzGoodsPackageService.deliverPackageQ(purchaseOrder);
    })
    .then(function(u){
      user = u;
      return UserSession.findOneQ({userId: userId});
    })
    .then(function(sess) {
      userSession = sess;
      if (userSession == null) {
        // 用户离线了
      } else {
        return getSessionBySidQ(userSession.frontendId, userSession.frontendSessionId);
      }
    })
    .then(function(pomeloSession) {
      if (!!pomeloSession) {
        return pushMessageQ('onChargeResult',
          {success: true, user: user.toParams()},
          [{uid: user.userId, sid:userSession.frontendId}]);
      } else {
        console.log('[ChargeEventService.onChargeEvent] user not online');
      }
    })
    .then(function() {
      console.log('[ChargeEventService.onChargeEvent] charge done~');
    })
    .fail(function(error) {
      console.error('[ChargeEventService.onChargeEvent] got error: ', error);
    });
};

module.exports = ChargeEventService;