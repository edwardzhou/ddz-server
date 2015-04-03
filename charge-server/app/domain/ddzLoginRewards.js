/**
 * Created by jeffcao on 15/2/3.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 无家登录奖励状况
 * @type {Mongoose.Schema}
 */
var ddzLoginRewardsSchema = new mongoose.Schema({
    userId: Number,    // 用户Id
    user_id: {type: mongoose.Schema.Types.ObjectId},
    login_days: Number,    // 奖励周期
    total_login_days: Number, // 已经连续登录天数
    last_login_date: {type: Date, default: Date.now}, // 最后一次登录日期
    reward_detail: {type: Schema.Types.Mixed, default: {_placeholder:0}},       // 奖励定义 (自定义配置)
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'ddz_login_rewards'
});

var __toParams = function(model, excludeAttrs) {

    var transObj = {
        totalDayCount: model.login_days,
        dayRewards: []
    };
    for(var i=1;i<=model.login_days;i++){
        var v_day = 'day_'+i;
        var v_day_reward = {day:v_day, status: model.reward_detail[v_day]["status"],
            bonus:model.reward_detail[v_day]["bonus"]};
        transObj.dayRewards.push(v_day_reward);
    }

    if (!!excludeAttrs) {
        for (var index=0; index<excludeAttrs.length; index++) {
            delete transObj[excludeAttrs[index]];
        }
    }

    return transObj;
};

ddzLoginRewardsSchema.statics.toParams = __toParams;

ddzLoginRewardsSchema.methods.toParams = function(excludeAttrs) {
    return __toParams(this, excludeAttrs);
};



var DdzLoginRewards = mongoose.model('DdzLoginRewards', ddzLoginRewardsSchema);

module.exports = DdzLoginRewards;