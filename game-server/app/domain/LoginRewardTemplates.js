/**
 * Created by jeffcao on 15/2/3.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 登录奖励模板
 * @type {Mongoose.Schema}
 */
var LoginRewardTemplatesSchema = new mongoose.Schema({
    login_days: Number,    // 奖励周期
    reward_detail: {type: Schema.Types.Mixed, default: {_placeholder:0}},       // 奖励定义 (自定义配置)
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'login_reward_templates'
});



var __toParams = function(model, excludeAttrs) {
    var transObj = {
        login_days: model.login_days,
        reward_detail: model.reward_detail
    };

    if (!!excludeAttrs) {
        for (var index=0; index<excludeAttrs.length; index++) {
            delete transObj[excludeAttrs[index]];
        }
    }

    return transObj;
};

LoginRewardTemplatesSchema.statics.toParams = __toParams;

LoginRewardTemplatesSchema.methods.toParams = function(excludeAttrs) {
    return __toParams(this, excludeAttrs);
};



var LoginRewardTemplates = mongoose.model('LoginRewardTemplates', LoginRewardTemplatesSchema);

module.exports = LoginRewardTemplates;