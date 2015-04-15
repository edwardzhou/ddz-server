/**
 * Created by jeffcao on 15/3/9.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');
var DomainUtils = require("./domainUtils");

/**
 * 破产补助模板
 * @type {Mongoose.Schema}
 */
var BankruptSaveTemplateSchema = new mongoose.Schema({
  count: Number,
  threshold: Number,
  save_detail: {type: Schema.Types.Mixed, default: {_placeholder: 0}},       // 补助定义 (自定义配置)
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
}, {
  collection: 'bankrupt_save_templates'
});


var __toParams = function (model, opts) {
  var transObj = {
    count: model.login_days,
    threshold: model.threshold,
    save_detail: model.save_detail
  };

  transObj = DomainUtils.adjustAttributes(transObj, opts);

  return transObj;
};

BankruptSaveTemplateSchema.statics.toParams = __toParams;

BankruptSaveTemplateSchema.methods.toParams = function (opts) {
  return __toParams(this, opts);
};


var BankruptSaveTemplate = mongoose.model('BankruptSaveTemplate', BankruptSaveTemplateSchema);

module.exports = BankruptSaveTemplate;