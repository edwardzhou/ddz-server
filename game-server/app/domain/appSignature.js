/**
 * Created by edwardzhou on 15/1/5.
 */

var DomainUtils = require("./domainUtils");

var mongoose = require('mongoose-q')();

/**
 * 认证的应用签名
 */
var appSignature = new mongoose.Schema({
  appId: String,
  appName: String,
  subject: String,
  subjectMD5: String,
  signature: String,
  signatureMD5: String,
  enabled: {type: Boolean, default: true},  // 是否启用
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'app_signatures' // 对应mongodb的集合名
});



var __toParams = function(model, opts) {
  var transObj = {
    appId: model.appId,
    appName: model.appName,
    subject: model.subject,
    subjectMD5: model.subjectMD5,
    signature: model.signature,
    signatureMD5: model.signatureMD5,
    enabled: model.enabled
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

appSignature.statics.toParams = __toParams;

appSignature.methods.toParams = function(opts) {
  return __toParams(this, opts);
};


var AppSignature = mongoose.model('AppSignature', appSignature);

module.exports = AppSignature;