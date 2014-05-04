var EventEmitter = require('events').EventEmitter;
var util = require('util');

var DomainBase = function(opts) {
  EventEmitter.call(this);
  // this._id = opts._id;
  //this.jsonAttrs = null;
};

util.inherits(DomainBase, EventEmitter);

module.exports = DomainBase;

DomainBase.jsonAttrs = null;

var _toParams = function(model, jsonAttrs, excludeAttrs) {
//  var jsonAttrs = this.constructor.jsonAttrs;
//  if (!!this.jsonAttrs)
//    jsonAttrs = this.jsonAttrs;
//

  if (jsonAttrs == null) {
    return (this instanceof DomainBase)? null : model;
  }

  var params = {};
  for (var propName in jsonAttrs) {
    if (!!excludeAttrs && excludeAttrs.indexOf(propName) >= 0)
      continue;

    var attrName = jsonAttrs[propName];
    var attrObj = model[propName];
    if (propName.indexOf('.') > 0) {
      var names = propName.split('.');
      attrObj = this;
      for(var index=0; index<names.length; index++) {
        attrObj = attrObj[names[index]];
        if (attrObj == null)
          break;
      }
    }

    if(attrObj instanceof Array) {
      params[attrName] = attrObj.map(function(element) {
        if (typeof(element.toParams) == 'function') {
          return element.toParams();
        } else {
          return element;
        }
      });
    } else if (typeof(attrObj) == 'object' && typeof(attrObj.toParams) == 'function') {
      params[attrName] = attrObj.toParams();
    } else {
      params[attrName] = attrObj;
    }
  }

  return params;
};

DomainBase.defineToParams = function(modelClazz, clazzMethodStub, instanceMethodStub) {
  clazzMethodStub = clazzMethodStub || modelClazz;
  instanceMethodStub = instanceMethodStub || modelClazz.prototype;

  clazzMethodStub.toParams = clazzMethodStub.toParams || function(modelData, excludeAttrs) {
    return DomainBase.toParams(modelData, {clazz:modelClazz, excludeAttrs: excludeAttrs});
  };

  instanceMethodStub.toParams = instanceMethodStub.toParams || function(excludeAttrs) {
    var jsonAttrs = modelClazz.jsonAttrs;
    if (!!this.jsonAttrs)
      jsonAttrs = this.jsonAttrs;

    if (jsonAttrs == null) {
      return this;
    }

    return _toParams(this, jsonAttrs, excludeAttrs);
  };
};

DomainBase.toParams = function(model, opts) {
  opts = opts || {};
  var excludeAttrs = opts.excludeAttrs;
  var jsonAttrs = opts.jsonAttrs;
  if (!!opts.clazz) {
    jsonAttrs = opts.clazz.jsonAttrs;
  }

  return _toParams(model, jsonAttrs, excludeAttrs);
};

DomainBase.test = function() {
  console.log('test[this] ==> ', this);
  return this;
};

DomainBase.prototype.toParams = function(excludeAttrs) {
  var jsonAttrs = this.constructor.jsonAttrs;
  if (!!this.jsonAttrs)
    jsonAttrs = this.jsonAttrs;

  if (jsonAttrs == null) {
    return (this instanceof DomainBase)? null : this;
  }

  return _toParams(this, jsonAttrs, excludeAttrs);

//  var params = {};
//  for (var propName in jsonAttrs) {
//    if (!!excludeAttrs && excludeAttrs.indexOf(propName) >= 0)
//      continue;
//
//    var attrName = jsonAttrs[propName];
//    var attrObj = this[propName];
//    if (propName.indexOf('.') > 0) {
//      var names = propName.split('.');
//      attrObj = this;
//      for(var index=0; index<names.length; index++) {
//        attrObj = attrObj[names[index]];
//        if (attrObj == null)
//          break;
//      }
//    }
//
//    if(attrObj instanceof Array) {
//      params[attrName] = attrObj.map(function(element) {
//         if (typeof(element.toParams) == 'function') {
//           return element.toParams();
//         } else {
//           return element;
//         }
//      });
//    } else if (typeof(attrObj) == 'object' && typeof(attrObj.toParams) == 'function') {
//      params[attrName] = attrObj.toParams();
//    } else {
//      params[attrName] = attrObj;
//    }
//  }
//
//  return params;
};

