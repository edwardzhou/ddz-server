var utils = module.exports;

// control variable of func "myPrint"
// var isPrintFlag = false;
var isPrintFlag = true;

/**
 * Check and invoke callback function
 */
utils.invokeCallback = function(cb) {
  if(!!cb && typeof cb === 'function') {
    cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * clone an object
 */
utils.clone = function(origin) {
  if(!origin) {
    return;
  }

  var obj = {};
  for(var f in origin) {
    if(origin.hasOwnProperty(f)) {
      obj[f] = origin[f];
    }
  }
  return obj;
};

utils.size = function(obj) {
  if(!obj) {
    return 0;
  }

  var size = 0;
  for(var f in obj) {
    if(obj.hasOwnProperty(f)) {
      size++;
    }
  }

  return size;
};

// print the file name and the line number ~ begin
function getStack(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };
  var err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}

function getFileName(stack) {
  return stack[1].getFileName();
}

function getLineNumber(stack){
  return stack[1].getLineNumber();
}

utils.myPrint = function() {
  if (isPrintFlag) {
    var len = arguments.length;
    if(len <= 0) {
      return;
    }
    var stack = getStack();
    var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
    for(var i = 0; i < len; ++i) {
      aimStr += arguments[i] + ' ';
    }
    console.log('\n' + aimStr);
  }
};
// print the file name and the line number ~ end

utils.on = function (obj, event, listener) {
  var listeners = obj.listeners(event);
  if (listeners.indexOf(listener) < 0)
    obj.on(event, listener);
};

utils.arrayIncludes = function(arrayA, arrayB) {
  if (arrayB.length < 1)
    return false;

  for (var index in arrayB) {
    var elem = arrayB[index];
    if (arrayA.indexOf(elem) < 0)
      return false;
  }

  return true;
};

utils.arrayRemove = function(arrayA, arrayB) {
  for (var index in arrayB) {
    var elem = arrayB[index];
    var i = arrayA.indexOf(elem);
    if (i>=0) {
      arrayA.splice(i, 1);
    }
  }

  return true;
};

utils.sortAscBy = function(field) {
  return function(a, b) {
    return b[field] - a[field];
  };
};

utils.sortDescBy = function(field) {
  return function(a, b) {
    return a[feild] - b[field];
  };
};

utils.kickBySession = function(session) {
  if (!!session.__sessionService__.kickBySessionId) {
    session.__sessionService__.kickBySessionId(session.id);
  } else if (!!session.__sessionService__.kickBySid) {
    session.__sessionService__.kickBySid(session.frontendId, session.id);
  }
};