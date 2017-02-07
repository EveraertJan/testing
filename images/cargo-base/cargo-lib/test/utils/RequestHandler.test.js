'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const RequestHandler = require('cargo-lib/utils/RequestHandler');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');
const Promise = require('bluebird');

const assert = chai.assert;
const log = log4js.getLogger('test');

describe('utils/RequestHandler', function () {

  it('resolve immediate', function (done) {
    const handler = new RequestHandler(log);
    handler.isReady();
    const request = handler.add(() => Promise.resolve(123));
    assert.instanceOf(request, Promise);
    assert.becomes(request, 123);
    assert.isFulfilled(request);
    assert.equal(handler.queueLength, 0, 'The queue should be empty.');
    done();
  });

  it('reject immediate', function (done) {
    const handler = new RequestHandler(log);
    const error = new Error('foo');
    handler.failed(error);
    const request = handler.add(() => Promise.resolve(123))
      .catch((error) => error.message || error);
    assert.instanceOf(request, Promise);
    assert.becomes(request, 'foo');
    assert.equal(handler.queueLength, 0, 'The queue should be empty.');
    done();
  });

  it('resolve deferred', function (done) {
    const handler = new RequestHandler(log);
    const request = handler.add(() => Promise.resolve(123));
    assert.instanceOf(request, Promise);
    assert.becomes(request, 123);
    assert.isTrue(request.isPending(), 'The request should be pending.');
    assert.equal(handler.queueLength, 1, 'The request should be in the queue.');
    handler.isReady();
    assert.isFulfilled(request);
    assert.equal(handler.queueLength, 0, 'The queue should be empty.');
    done();
  });

  it('reject deferred', function (done) {
    const handler = new RequestHandler(log);
    const error = new Error('foo');
    const request = handler.add(() => Promise.resolve(123))
      .catch((error) => error.message || error);
    assert.instanceOf(request, Promise);
    assert.becomes(request, 'foo');
    assert.isTrue(request.isPending(), 'The request should be pending.');
    assert.equal(handler.queueLength, 1, 'The request should be in the queue.');
    handler.failed(error);
    assert.equal(handler.queueLength, 0, 'The queue should be empty.');
    done();
  });

});
