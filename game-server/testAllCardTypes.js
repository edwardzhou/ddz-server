/**
 * Created by edwardzhou on 14/12/16.
 */



var CardUtil = require('./app/util/cardUtil');
CardUtil.buildCardTypes();
var s = JSON.stringify(CardUtil.allCardTypes)

var fs = require('fs');
fs.writeFileSync('./data/allCardTypes.json', s);