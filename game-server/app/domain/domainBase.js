var EventEmitter = require('events').EventEmitter;
var util = require('util');

var DomainBase = function(opts) {
  EventEmitter.call(this);
  this._id = opts._id;
  this.jsonAttrs = null;
};

util.inherits(DomainBase, EventEmitter);

module.exports = DomainBase;

DomainBase.prototype.toParams = function(excludeAttrs) {
  if (this.jsonAttrs == null) {
    return null;
  }

  var params = {};
  for (var p in this.jsonAttrs) {
    if (!!excludeAttrs && excludeAttrs.indexOf(p) >= 0)
      continue;
    if(this[p] instanceof Array) {
      params[this.jsonAttrs[p]] = this[p].map(function(element) {
         if (typeof(element.toParams) == 'function') {
           return element.toParams();
         } else {
           return element;
         }
      });
    } else if (typeof(this[p]) == 'object' && typeof(this[p].toParams) == 'function') {
      params[this.jsonAttrs[p]] = this[p].toParams();
    } else {
      params[this.jsonAttrs[p]] = this[p];
    }
  }

  return params;
};

