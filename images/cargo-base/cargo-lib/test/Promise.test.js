'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const arrayDiff = require('cargo-lib/utils/arrayDiff');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const assert = chai.assert;

const log = log4js.getLogger('Promise.test');

describe('Promise', function () {

  describe('Promise basics', function () {

    it('should reject when error is thrown in then()', function () {
      return assert.isRejected(Promise.delay(50)
        .then(() => {
          throw new Error(foo);
        }));
    });

    it('should resolve to the promised value returned in catch()', function () {
      assert.becomes(Promise.reject(new Error('foo'))
        .catch(() => Promise.resolve('bar').delay(50)),
        'bar');
    });

    it('should reject when catch() returns rejected promise', function () {
      const error = new Error('bar');
      assert.isRejected(Promise.reject(new Error('foo'))
        .catch(() => Promise.reject(error).delay(50)),
        error);
    });

    it('catch(() => null) vs. catch(null)', function () {
      assert.isFulfilled(Promise.reject(new Error('foo')).catch(() => null));
      assert.isRejected(Promise.reject(new Error('foo')).catch(null));
    });

  });

  describe('Promise.coroutine', function () {

    it('should resolve upon simple return', function () {
      return assert.isFulfilled(Promise.coroutine(function* () {
        return;
      })());
    });

    it('should resolve to the returned value', function () {
      return assert.becomes(Promise.coroutine(function* () {
        return 123;
      })(), 123);
    });

    it('should resolve to the returned false value', function () {
      return assert.becomes(Promise.coroutine(function* () {
        return false;
      })(), false);
    });

    it('should reject when an error is thrown', function () {
      return assert.isRejected(Promise.coroutine(function* () {
        throw new Error('foo');
      })());
    });

    it('should reject when yielding a rejected promise', function () {
      const error = new Error('foo');
      return assert.isRejected(Promise.coroutine(function* () {
        yield Promise.reject(error);
      })(), error);
    });

    it('should resolve to the value the returned promise', function () {
      return assert.becomes(Promise.coroutine(function* () {
        return Promise.resolve(123).delay(50);
      })(), 123);
    });

  });

});
