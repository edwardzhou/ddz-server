/**
 * Created by edwardzhou on 14/12/22.
 */

Array.prototype.append = function(otherArray) {
  for (var index=0; index<otherArray.length; index++) {
    this.push(otherArray[index]);
  }
  return this;
};

Array.prototype.preappend = function(otherArray) {
  Array.prototype.splice.apply(this, [0,0].concat(otherArray));

  return this;
};

Array.prototype.exclude = function(otherArray) {
  if (otherArray == null) {
    return this;
  }

  for (var index=0; index<otherArray.length; index++) {
    var foundIndex = this.indexOf(otherArray[index]);
    if (foundIndex >= 0) {
      this.splice(foundIndex, 1);
    }
  }

  return this;
};

Array.prototype.toParams = function(excludeAttrs) {
  var result = [];
  var obj;
  for (var index=0; index<this.length; index++) {
    obj = this[index];
    if (typeof obj.toParams == 'function') {
      result.push(obj.toParams(excludeAttrs));
    } else {
      result.push(obj);
    }
  }

  return result;
};