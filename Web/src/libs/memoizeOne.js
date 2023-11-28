/* eslint-disable */
import _ from 'lodash';

var simpleIsEqual = function simpleIsEqual(a, b) {
  return a === b;
};

// aa = memoizeOneCurry(true, (a,b) => {});
// aa(true)(a,b,c);
var memoizeOneCurry = function (func) {
  var cacheCurry = {};

  return function (value) {
    if (value == null) {
      value = 'null4232424';
    }

    let res = cacheCurry[value];
    if (res == null) {
      res = memoizeOne(func, undefined, undefined, undefined, value);
      cacheCurry[value] = res;
    }

    return res;
  };
};

var memoizeBind = function ($this, func) {
  var cacheCurry = {};

  return function (value) {
    if (value == null) {
      value = 'null4232424';
    }

    let res = cacheCurry[value];
    if (res == null) {
      res = func.bind($this, value);
      cacheCurry[value] = res;
    }

    return res;
  };
};

var memoizeOne = function (resultFn) {
  var isEqual = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : simpleIsEqual;
  var isEqualSecond = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var showWhichIsDifferent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  var curryValue = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : undefined;

  var lastThis = void 0;
  var lastArgs = [];
  var lastResult = void 0;
  var calledOnce = false;

  let isNewArgEqualToLast = function isNewArgEqualToLast(newArg, index) {
    return isEqual(newArg, lastArgs[index]);
  };

  let result = function result() {
    for (var _len = arguments.length, newArgs = Array(_len), _key = 0; _key < _len; _key++) {
      newArgs[_key] = arguments[_key];
    }

    if (calledOnce && lastThis === this && newArgs.length === lastArgs.length) {
      let same = false;
      if (isEqualSecond != null) {
        same = isEqualSecond(newArgs, lastArgs);
      } else {
        same = newArgs.every(isNewArgEqualToLast);
      }

      if (same) {
        return lastResult;
      } else {
        if (showWhichIsDifferent === true) {
          for (var _len2 = arguments.length, _key2 = 0; _key2 < _len2; _key2++) {
            if (!_.isEqual(newArgs[_key2], lastArgs[_key2])) {
              console.error('Difference: arg.pos: ' + _key2 + ' ' + JSON.stringify(newArgs[_key2]));
            } else if (newArgs[_key2] !== lastArgs[_key2]) {
              console.error('Difference.2: arg.pos: ' + _key2 + ' ' + JSON.stringify(newArgs[_key2]));
            }
          }
        }
      }
    }

    calledOnce = true;
    lastThis = this;
    lastArgs = [...newArgs];

    let argsSend = newArgs;
    if (curryValue !== undefined) {
      argsSend = [...newArgs];
      argsSend.unshift(curryValue);
    }
    lastResult = resultFn.apply(this, argsSend);
    return lastResult;
  };

  return result;
};

export { memoizeOneCurry, memoizeBind };
export default memoizeOne;
