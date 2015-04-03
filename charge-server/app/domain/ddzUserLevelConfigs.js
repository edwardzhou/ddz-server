/**
 * Created by jeffcao on 15/2/16.
 */
var mongoose = require('mongoose-q')();
var Schema = mongoose.Schema;
var crypto = require('crypto');
var uuid = require('node-uuid');

/**
 * 玩家等级名称配置表
 * @type {Mongoose.Schema}
 */
var ddzUserLevelConfigsSchema = new mongoose.Schema({
    level_name: String,
    max_coins: Number,
    min_coins: Number,
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'ddz_user_level_configs'
});



var __toParams = function(model, excludeAttrs) {
    var transObj = {
        level_name: model.level_name,
        max_coins: model.max_coins,
        min_coins: model.min_coins
    };

    if (!!excludeAttrs) {
        for (var index=0; index<excludeAttrs.length; index++) {
            delete transObj[excludeAttrs[index]];
        }
    }

    return transObj;
};

ddzUserLevelConfigsSchema.statics.toParams = __toParams;

ddzUserLevelConfigsSchema.methods.toParams = function(excludeAttrs) {
    return __toParams(this, excludeAttrs);
};



var DdzUserLevelConfigs = mongoose.model('DdzUserLevelConfigs', ddzUserLevelConfigsSchema);

module.exports = DdzUserLevelConfigs;