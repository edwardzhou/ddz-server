var EventEmitter = require('events').EventEmitter;
var util = require('util');

var DomainBase = function(opts) {
  EventEmitter.call(this);
  this._id = opts._id;
  //this.jsonAttrs = null;
};

util.inherits(DomainBase, EventEmitter);

module.exports = DomainBase;

DomainBase.jsonAttrs = null;

DomainBase.prototype.toParams = function(excludeAttrs) {
  var jsonAttrs = this.constructor.jsonAttrs;
  if (!!this.jsonAttrs)
    jsonAttrs = this.jsonAttrs;


  if (jsonAttrs == null) {
    return (this instanceof DomainBase)? null : this;
  }

  var params = {};
  for (var p in jsonAttrs) {
    if (!!excludeAttrs && excludeAttrs.indexOf(p) >= 0)
      continue;
    if(this[p] instanceof Array) {
      params[jsonAttrs[p]] = this[p].map(function(element) {
         if (typeof(element.toParams) == 'function') {
           return element.toParams();
         } else {
           return element;
         }
      });
    } else if (typeof(this[p]) == 'object' && typeof(this[p].toParams) == 'function') {
      params[jsonAttrs[p]] = this[p].toParams();
    } else {
      params[jsonAttrs[p]] = this[p];
    }
  }

  return params;
};

