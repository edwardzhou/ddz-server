/**
 * Created by jeffcao on 15/3/9.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 破产补助模板
 * @type {Mongoose.Schema}
 */
var BrokenSaveTemplatesSchema = new mongoose.Schema({
    count: Number,
    threshold: Number,
    save_detail: {type: Schema.Types.Mixed, default: {_placeholder:0}},       // 补助定义 (自定义配置)
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'broken_save_templates'
});



var __toParams = function(model, excludeAttrs) {
    var transObj = {
        count: model.login_days,
        threshold: model.threshold,
        save_detail: model.save_detail
    };

    if (!!excludeAttrs) {
        for (var index=0; index<excludeAttrs.length; index++) {
            delete transObj[excludeAttrs[index]];
        }
    }

    return transObj;
};

BrokenSaveTemplatesSchema.statics.toParams = __toParams;

BrokenSaveTemplatesSchema.methods.toParams = function(excludeAttrs) {
    return __toParams(this, excludeAttrs);
};



var BrokenSaveTemplates = mongoose.model('BrokenSaveTemplates', BrokenSaveTemplatesSchema);

module.exports = BrokenSaveTemplates;