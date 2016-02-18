var mocha = require('mocha');
var assert = require('chai').assert;
var Promise = require('../lib/promise.js');

describe('Promises', function() {
  describe('Promise.resolve', function() {

    it('should return promise', function() {
      var promise = Promise.resolve(123);

      assert.strictEqual(promise instanceof Promise, true);
    });


    it('has value equal 1', function(done) {
      var promise = Promise.resolve(1);

      promise.then(function(v) {
        assert.strictEqual(v, 1);
        done();
      });
    });

    it('should return promise ????????', function() {
      var value = new Promise(function(resolve, reject) {
        resolve(1);
      });

      var promise = Promise.resolve(value);

      assert.strictEqual(promise, value);
    });
  });

  describe('Promise.reject', function() {

    it('should return an error', function(done) {
      var promise = Promise.reject('error');

      promise.catch(function(r) {
        assert(r);
        done();
      });
    });
  });

  describe('Promise.all', function() {

    describe('success', function() {
      var promise;

      beforeEach(function() {
        promise = Promise.all([
          'test',
          new Promise(function(resolve, reject) {
            setTimeout(function() {
              resolve('some value');
            }, 100);
          }),
          123
        ]);
      });

      it('should return array', function(done) {
        promise.then(function(result) {
          assert.isArray(result);
          done();
        });
      });

      it('should return array length equal 3', function(done) {
        promise.then(function(result) {
          assert.strictEqual(result.length, 3);
          done();
        });
      });

      it('should return array[0] equal "test"', function(done) {

        promise.then(function(result) {
          assert.strictEqual(result[0], 'test');
          done();
        });
      });

      it('should return array[1] equal "some value"', function(done) {

        promise.then(function(result) {
          assert.strictEqual(result[1], 'some value');
          done();
        });
      });


      it('should return array[2] equal 123', function(done) {

        promise.then(function(result) {
          assert.strictEqual(result[2], 123);
          done();
        });
      });
    });


    describe('fail', function() {
      var promise;

      beforeEach(function() {
        promise = Promise.all([
          'test',
          new Promise(function(resolve, reject) {
            setTimeout(function() {
              reject('error');
            }, 100);
          }),
          123
        ]);
      });

      it('should return an error', function(done) {
        promise.catch(function(error) {
          assert(error);
          done();
        });
      })
    });


  });


  describe('Promise.race', function() {
    describe('success', function() {
      var promise;

      promise = Promise.race([
        new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve(5);
          }, 800);
        }),

        new Promise(function(resolve, reject) {
          setTimeout(function() {
            resolve(6);
          }, 100);
        })
      ]);

      it ('should return 6', function(done) {
        promise.then(function(v) {
          assert.strictEqual(v, 6);
          done();
        });
      });
    });

    describe('fail', function() {
      var promise;

      promise = Promise.race([
        new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(5);
          }, 800);
        }),

        new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(6);
          }, 100);
        })
      ]);

      it ('should return 6', function(done) {
        promise.catch(function(v) {
          assert.strictEqual(v, 6);
          done();
        });
      });
    });
  });


});