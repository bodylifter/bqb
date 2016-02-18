'use strict';

var PENDING, FULFILLED, REJECTED;

// Status of promise
PENDING = 0; FULFILLED = 1; REJECTED = 2;

/**
 * Get the type of value.
 * @param v - value
 * @returns {string}
 */
function realType(v) {
  var str = Object.prototype.toString.call(v);
  return str.substring(8, str.length - 1);
}

/**
 * Checks that the value is a function.
 * @param v - value
 * @returns {boolean}
 */
function isFunction(v) {
  return realType(v) == 'Function';
}

/**
 * Checks that the value is an object.
 * @param v - value
 * @returns {boolean}
 */
function isObject(v) {
  return realType(v) == 'Object';
}

/**
 * Checks that the value is an array.
 * @param v - value
 * @returns {boolean}
 */
function isArray(v) {
  return realType(v) == 'Array';
}

/**
 * Checks that the value is a Promise.
 * @param v - value
 * @returns {boolean}
 */
function isThenable(v) {
  return v && v instanceof Promise;
}

/**
 * Executes all callbacks.
 * @param state - Promise state
 * @param value - Promise value
 * @param callbacks - Promise callbacks
 */
function executeCallbacks(state, value, callbacks) {
  setTimeout(function() {
    if (state == PENDING) {
      return;
    }

    while (callbacks.length) {
      callbacks.shift().call(undefined, state, value);
    }
  }, 0);
}

/**
 * Creates a new Promise, whose value is calculated later.
 * @returns {object} new Promise
 */
function then(state, value, callbacks, onFulfilled, onRejected) {
  var newPromise, resolve, reject, result;

  newPromise = new Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  });

  callbacks.push(function(state, value) {
    try {
      if (state == FULFILLED) {
        if (isFunction(onFulfilled)) {
          result = onFulfilled(value);
        } else {
          result = value;
        }
      } else if (state == REJECTED) {
        if (isFunction(onRejected)) {
          result = onRejected(value);
        } else {
          reject(value);
        }
      }
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });

  // Value could be calculated already
  executeCallbacks(state, value, callbacks);

  return newPromise;
}


/**
 * Sets Promise state and value.
 * @returns {object} Promise
 */
function Resolve(promise, x, changeState) {
  if (promise == x) {
    return changeState(REJECTED, new TypeError('Promise and value are the same object'));
  }

  if (isThenable(x)) {
    x.then(function(value) {
      Resolve(promise, value, changeState);
    }, function(reason) {
      changeState(REJECTED, reason);
    });
  } else if (isObject(x) || isFunction(x)) {
    var isPerformed, handler;

    isPerformed = false;

    try {
      handler = x.then;

      if (isFunction(handler)) {
        handler.call(x, function (y) {
          if (!isPerformed) {
            Resolve(promise, y, changeState);
            isPerformed = true;
          }
        }, function (r) {
          if (!isPerformed) {
            changeState(REJECTED, r);
            isPerformed = true;
          }
        });
      } else {
        changeState(FULFILLED, x);
        isPerformed = true;
      }
    } catch (e) {
      if (!isPerformed) {
        changeState(REJECTED, e);
        isPerformed = true;
      }
    }
  } else {
    changeState(FULFILLED, x);
  }

  return promise;
}

/**
 * Return Promise.
 * @constructor
 * @param {function} executor
 */
function Promise(executor) {
  var promise, _state, _value, callbacks;

  if (this == undefined) {
    throw new TypeError('Promise constructor is called without `new` operator');
  }

  if (!isFunction(executor)) {
    throw new TypeError('Passed argument is not valid. You must pass a function');
  }

  promise = this;
  _state = PENDING;
  _value = undefined;
  callbacks = [];

  /**
   * The then() method returns a Promise. It takes two arguments: callback functions for the success and failure cases of the Promise.
   * @constructor
   * @returns {object} new Promise
   */
  promise.then = function(onFulfilled, onRejected) {
    return then(_state, _value, callbacks, onFulfilled, onRejected);
  };

  // Changes Promise state
  function changeState(state, value) {
    if (_state != PENDING) {
      return;
    }

    _state = state;
    _value = value;

    executeCallbacks(_state, _value, callbacks);
  }

  executor(function(value) {
    Resolve(promise, value, function(state, value) {
      changeState(state, value);
    });
  }, function(reason) {
    changeState(REJECTED, reason);
  });

  return promise;
}

/**
 * The catch method returns a Promise and deals with rejected cases only. It behaves the same as calling Promise.prototype.then(undefined, onRejected)
 * @returns {object} new Promise
 */
Promise.prototype['catch'] = function(onRejected) {
  if (!isThenable(this)) {
    throw new TypeError('`this` must be a Promise');
  }
  return this.then(undefined, onRejected);
};

/**
 * The Promise.resolve(value) method returns a Promise object that is resolved with the given value. If the value is a thenable (i.e. has a then method), the returned promise will "follow" that thenable, adopting its eventual state; otherwise the returned promise will be fulfilled with the value.
 * @returns {object} new Promise
 */
Promise.resolve = function(value) {
  if (this == undefined || this != Promise) {
    throw new TypeError('`this` must be a Promise');
  }

  if (isThenable(value)) {
    return value;
  }

  return new Promise(function(resolve, reject) {
    resolve(value);
  });
};

/**
 * The Promise.reject(reason) method returns a Promise object that is rejected with the given reason.
 * @returns {object} new Promise
 */
Promise.reject = function(reason) {
  if (this == undefined || this != Promise) {
    throw new TypeError('`this` must be a Promise');
  }

  return new Promise(function(resolve, reject) {
    reject(reason);
  })
};

/**
 * The Promise.all(iterable) method returns a promise that resolves when all of the promises in the iterable argument have resolved, or rejects with the reason of the first passed promise that rejects.
 * @returns {object} new Promise
 */
Promise.all = function(input) {
  var result, received, inputLength;

  if (this == undefined || this != Promise) {
    throw new TypeError('`this` must be a Promise');
  }

  if (!input || !isArray(input)) {
    throw new TypeError('argument must be an array');
  }

  result = [];
  received = 0;
  inputLength = input.length;

  return new Promise(function(resolve, reject) {
    input.forEach(function(item, i) {
      if (!isThenable(item)) {
        item = Promise.resolve(item);
      }

      item.then(function(value) {
        result[i] = value;
        ++received;
        if (received == inputLength) {
          resolve(result);
        }
      }, function(reason) {
        reject(reason);
      });
    });
  });
};

/**
 * The Promise.race(iterable) method returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects, with the value or reason from that promise.
 * @returns {object} new Promise
 */
Promise.race = function(input) {
  if (this == undefined || this != Promise) {
    throw new TypeError('`this` must be a Promise');
  }

  if (!input || !isArray(input)) {
    throw new TypeError('argument must be an array');
  }

  return new Promise(function(resolve, reject) {
    for (var i = 0, l = input.length, item; i < l; i++) {
      item = input[i];
      if (!isThenable(item)) {
        item = Promise.resolve(item);
      }

      item.then(function(value) {
        resolve(value);
      }, function(reason) {
        reject(reason);
      });
    }
  });
};


module.exports = Promise;