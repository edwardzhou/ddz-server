/**
 * Created by jeffcao on 15/4/8.
 */

var mongoose = require('mongoose-q')();

var PlayWithMeUserSchema = mongoose.Schema({
    me_userId: Number,
    userId: Number,   // 用户Id
    nickName: String,
    play_count: {type:Number, default: 0}, // 金币数
    gameStat: {     // 输赢统计
        won: {type: Number, default: 0},
        lose: {type: Number, default: 0}
    },
    last_play_with_me_date: {type: Date, default: Date.now},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'play_with_me_users'
});


var __toParams = function(model, excludeAttrs) {
    var transObj = {
        nickName: model.nickName,
        userId: model.userId,
        play_count: model.play_count,
        last_play_with_me_date: model.last_play_with_me_date,
        gameStat: model.gameStat
    };

    if (!!excludeAttrs) {
        for (var index=0; index<excludeAttrs.length; index++) {
            delete transObj[excludeAttrs[index]];
        }
    }

    return transObj;
};

PlayWithMeUserSchema.statics.toParams = __toParams;

PlayWithMeUserSchema.methods.toParams = function(excludeAttrs) {
    return __toParams(this, excludeAttrs);
};

var PlayWithMeUser = mongoose.model('PlayWithMeUser', PlayWithMeUserSchema);


module.exports = PlayWithMeUser;