/**
 * Created by edwardzhou on 14-9-5.
 */

var logger = require('pomelo-logger').getLogger('pomelo', __filename);
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

var _isShutdown = false;

var ChargeEventService = function() {
};

ChargeEventService.shutdown = function() {
  _isShutdown = true;
};

ChargeEventService.init = function(app, opts) {
  pomeloApp = app;
  var setupSubscriber = null;

  setupSubscriber = function() {
    var subs = PubSubEvent.find({active: 1})
      .tailable({awaitdata:true})
      .setOptions({numberOfRetries: 10000000})
      .stream()
      .on('data', ChargeEventService.dispatchEvent.bind(this))
      .on('close', function(){
        console.log('[ChargeEventService] event tail stream closed. isShutdown: ', _isShutdown);
        if (!_isShutdown) {
          console.log('[ChargeEventService] setup event subscriber again.');
          setupSubscriber();
        }
      })
      .on('error', function(err) {
        console.error('[ChargeEventService] event tail stream error: ', err);
      });
    console.log('start to subscribe charge events.');

  };

  setTimeout(setupSubscriber, 3000);
};

ChargeEventService.dispatchEvent = function(event) {

  logger.info('[ChargeEventService.dispatchEvent] event: ', event);

  event.active = 0;
  var orderId = event.eventData.orderId;
  var userId = event.eventData.userId;
  var user = null;
  var purchaseOrder = null;
  var userSession = null;

  event.saveQ()
    .then(function(){
      if (event.eventName == 'charge') {
        ChargeEventService.dispatchChargeEvent(event);
      } else if (event.eventName == 'reload_cache') {
        ChargeEventService.dispatchReloadCacheEvent(event);
      } else {
        logger.warn('[ChargeEventService.dispatchEvent] unknown event "%s": ', event.eventName, event);
      }
    })
    .fail(function(err) {
      logger.error('[ChargeEventService.dispatchEvent] error: ', err);
    });
};

ChargeEventService.dispatchReloadCacheEvent = function(event) {
  if (event.eventData.reloadTarget == 'packages') {
    pomeloApp.rpc.area.hallRemote.refreshGoodsPackages.toServer('*', null);
  } else if (event.eventData.reloadTarget =='rooms') {
    pomeloApp.rpc.area.roomRemote.reloadRooms.toServer('*', {}, null);
  }

};


ChargeEventService.dispatchChargeEvent = function(event) {

  if (sessionService == null) {
    sessionService = pomeloApp.get('backendSessionService');
    //msgService = pomeloApp.get('messageService');
    getSessionBySidQ = Q.nbind(sessionService.get, sessionService);
    pushMessageQ = Q.nbind(msgService.pushMessage, msgService);
  }

  var orderId = event.eventData.orderId;
  var userId = event.eventData.userId;
  var user = null;
  var purchaseOrder = null;
  var userSession = null;

  PurchaseOrder.findOneQ({orderId: orderId})
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
        var msgBody = {
          success: true,
          purchaseOrderId: purchaseOrder.orderId,
          user: user.toParams(['authToken', 'lastSignedInTime'])
        };

        return pushMessageQ('onChargeResult',
          msgBody,
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