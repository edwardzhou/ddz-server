/**
 * Created by edwardzhou on 14-10-9.
 */


PaymentMethod = require('../app/domain/paymentMethod');
Channel = require('../app/domain/channel');

initChannels = function() {
  var results = {};
  var channel = new Channel();
  channel.channelId = 1000;
  channel.channelName = '官方测试版';

  PaymentMethod.findOneQ({methodId: 'test'})
    .then(function(paymentMethod) {
      channel.paymentMethod = paymentMethod;
      return channel.saveQ();
    })
    .then(function(){
      console.info('channel initialized~');
    })
    .fail(function(err) {
      console.error('[initChannels] Error: ' , err);
    });
};