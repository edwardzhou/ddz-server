/**
 * Created by edwardzhou on 14/12/16.
 */


var util = require('util');

var CardUtil = require('./app/util/cardUtil');
CardUtil.buildCardTypes();
var s = JSON.stringify(CardUtil.allCardTypes)

var fs = require('fs');
//fs.writeFileSync('./data/allCardTypes.json', s);

var tmp;
var value;
var tmpValue;
var f = fs.openSync('./data/allCardTypes.lua', 'w');
fs.writeSync(f, "allCardTypes = {}\n");
for (var key in CardUtil.allCardTypes)
{
  value = CardUtil.allCardTypes[key];
  tmpValue = new Array();
  for (var vk in value) {
    var ts = util.format("%s = %s", vk, JSON.stringify(value[vk]));
    if (ts.length > 0)
      tmpValue.push(ts);
  }

  tmp = util.format("allCardTypes['%s'] = { %s }\n", key, tmpValue.join(", "));
  fs.writeSync(f, tmp);
}
fs.close(f);

var count = 100;
var current = 0;
var index = 1;

tmp = {};
for (var key in CardUtil.allCardTypes) {
  tmp[key] = CardUtil.allCardTypes[key];
  current ++;
  if (current >= count) {
    fs.writeFileSync(util.format('./data/allCardTypes_%d.json', index++), JSON.stringify(tmp));
    current = 0;
    tmp = {};
  }
}

fs.writeFileSync(util.format('./data/allCardTypes_%d.json', index++), JSON.stringify(tmp));
