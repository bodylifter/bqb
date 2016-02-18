var mocha = require('mocha');
var Promise = require('../lib/promise.js');
var tests = require("promises-aplus-tests");

var adapter = {
  resolved: function (value) {
    return Promise.resolve(value);
  },
  rejected: function (reason) {
    return Promise.reject(reason);
  },
  deferred: function () {
    var resolve, reject;

    return {
      promise: new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
      }),
      resolve: resolve,
      reject: reject
    };
  }
};


tests(adapter, function(err) {});