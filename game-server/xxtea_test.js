/**
 * Created by edwardzhou on 14-10-14.
 */

xxtea = require('./app/util/xxtea');
crypto = require('crypto') ;

e2 = new Buffer('htiVSgHS7GjJqtT4', 'base64');

text = 'You can make this slightly more compact using reduce';

key = 'demo';

xx = xxtea.encryptToArray(text, key);
console.log('xxtea.encryptToArray xx => ',  xx);

s1 = xxtea.longArrayToString(xx, false);
s2 = (new Buffer(s1, 'ascii')).toString('base64');
console.log('xxtea.longArrayToString s2 =>' , s2);

de = xxtea.decryptToArray(xx, key);
console.log('xxtea.decryptToArray de => ',  de);
console.log('xxtea.longArrayToString de =>' , xxtea.longArrayToString(de, false));
console.log('xxtea.decrypt s1 => ', xxtea.decrypt(s1, key));

xx = xxtea.encryptToArray(text, key);
s3 = xxtea.longArrayToBuffer(xx, false);
console.log('xxtea.longArrayToBuffer s3 =>' , s3);
console.log(s3.toString('base64'));
de = xxtea.decrypt(s3, key);
console.log(de);
console.log('--------------------');

a = new Buffer('htiVSgHS7GjJqtT4', 'base64');
b = xxtea.bufferToLongArray(a, false);
c = xxtea.decryptToArray(b, key);
d = xxtea.longArrayToBuffer(c, true);
console.log(a , ' decoded ==> ', d.toString());


xx = xxtea.encryptToArray('D4DB1295EA1B3298DD256AF4BEBCFC0C', '3b231fa12a107950e87207843dcb8e2c');
s3 = xxtea.longArrayToBuffer(xx, false);
s4 = s3.toString('base64');
//s4 = Buffer.concat([ s3,  new Buffer('3b231fa12a107950e87207843dcb8e2c', 'ascii')]);
s5 = 'D4DB1295EA1B3298DD256AF4BEBCFC0C' + '3b231fa12a107950e87207843dcb8e2c';
console.log('xxtea.longArrayToBuffer s3 =>' , s3);
console.log('xxtea.longArrayToBuffer s4 =>', s4);
a = crypto.createHash('md5').update(s5).digest('hex');
console.log(a);