/**
 * Created by jeffcao on 15/3/9.
 */

var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 玩家破产补助情况
 * @type {Mongoose.Schema}
 */
var DdzBrokenSavingsSchema = new mongoose.Schema({
    userId: Number,    // 用户Id
    user_id: {type: mongoose.Schema.Types.ObjectId},
    count: Number,    // 奖励周期
    threshold: Number,    // 奖励周期
    saved_times: {type: Number, default: 0},    // 奖励周期
    total_login_days: Number, // 已经连续登录天数
    autoRemoveAt: {type: Date, expires: 0},
    save_detail: {type: Schema.Types.Mixed, default: {_placeholder:0}},       // 奖励定义 (自定义配置)
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'ddz_broken_savings'
});

var __toParams = function(model, excludeAttrs) {

    var transObj = {
        saved_times: model.saved_times
    };

    if (!!excludeAttrs) {
        for (var index=0; index<excludeAttrs.length; index++) {
            delete transObj[excludeAttrs[index]];
        }
    }

    return transObj;
};

DdzBrokenSavingsSchema.statics.toParams = __toParams;

DdzBrokenSavingsSchema.methods.toParams = function(excludeAttrs) {
    return __toParams(this, excludeAttrs);
};



var DdzBrokenSavings = mongoose.model('DdzBrokenSavings', DdzBrokenSavingsSchema);

module.exports = DdzBrokenSavings;