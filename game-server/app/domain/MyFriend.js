/**
 * Created by jeffcao on 15/4/21.
 */



/**
 * 我的好友
 */
var mongoose = require('mongoose-q')();
var DomainUtils = require("./domainUtils");


var MyFriendSchema = mongoose.Schema({
    user_id: {type: mongoose.Schema.Types.ObjectId},
    userId: Number,   // 用户Id
    friends: {type: mongoose.Schema.Types.Mixed},
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
}, {
    collection: 'my_friends'
});


var __toParams = function(model, opts) {
    var transObj = {
        userId: model.userId,
        friends: model.friends,
        updated_at: model.updated_at
    };
    transObj.friends.sort(function (x, y){
       if (x.addDate > y.addDate){
           return -1;
       }
        if (x.addDate < y.addDate){
            return 1;
        }
        return 0;

    });
    transObj = DomainUtils.adjustAttributes(transObj, opts);

    return transObj;
};

MyFriendSchema.statics.toParams = __toParams;

MyFriendSchema.methods.toParams = function(opts) {
    return __toParams(this, opts);
};


var MyFriend = mongoose.model('MyFriend', MyFriendSchema);


module.exports = MyFriend;