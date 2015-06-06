/**
 * Copyright (c) 2015 深圳市辉游科技有限公司.
 */

require('./ArrayHelper');

var domainUtils = function() {
};

domainUtils.adjustAttributes = function(transObj, opts) {
  opts = opts || {};
  var excludeAttrs = opts.exclude;
  var onlyAttrs = opts.only;

  if (!!onlyAttrs) {
    newTransObj = {};
    for (var index = 0; index < onlyAttrs.length; index++) {
      newTransObj[onlyAttrs[index]] = transObj[onlyAttrs[index]];
    }
    transObj = newTransObj;
  }

  if (!!excludeAttrs) {
    for (var index = 0; index < excludeAttrs.length; index++) {
      delete transObj[excludeAttrs[index]];
    }
  }

  return transObj;
};

domainUtils.hasAttr = function(model, opts, attrName) {
  var result = true;
  if (!model[attrName]) {
    return false;
  }

  opts = opts || {};

  if (!!opts.only && opts.only.indexOf(attrName)<0) {
    result = false;
  }
  if (!!opts.exclude && opts.exclude.indexOf(attrName)>=0) {
    result = false;
  }

  return result;
};

domainUtils.transAttr = function(transObj, model, opts, attrName, attrOpts) {
  if (domainUtils.hasAttr(model, opts, attrName)) {
    if (!!model[attrName].toParams)
      transObj[attrName] = model[attrName].toParams(attrOpts);
    else
      transObj[attrName] = model[attrName];
  }
};

module.exports = domainUtils;