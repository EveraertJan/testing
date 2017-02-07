'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const _ = require('lodash');
const log4js = require('log4js');

// -------------------------------------------------------------------------------------------------

const log = log4js.getLogger('RequestHandler');

/**
 * Fulfills requests according to the readiness of the client service.
 */
class RequestHandler {

  constructor() {
    this._ready = false;
    this._failed = false;
    this._errorMsg = null;
    //this._terminated = false;
    this._queue = [];
  }

  /**
   * @returns {Number} The current number of pending requests.
   */
  get queueLength() { return this._queue.length; }

  /**
   * Switch the state to ready, apply all pending requests.
   */
  isReady() {
    if (this._ready) { return; }

    this._ready = true;
    this._failed = false;
    this._error = null;

    while (this._queue.length > 0) {
      const { thunk, resolve, reject } = this._queue.shift();
      thunk().then(resolve).catch(reject);
    }
  }

  /**
   * Hold the queue, queue pending requests.
   */
  hold() {
    this._ready = false;
    this._failed = false;
    this._error = null;
  }

  /**
   * Switch the state to failed, reject all pending requests.
   *
   * @param {Error|string} error
   */
  failed(error) {
    if (this._failed) { return; }

    this._ready = false;
    this._failed = true;
    this._error = _.isString(error) ? new Error(error) : error;

    while (this._queue.length > 0) {
      this._queue.shift().reject(this._error);
    }
  }

  /**
   * Add a request.
   * @param {Function => Promise} thunk - A function that takes no arguments and returns a Promise
   *        that fulfills the request.
   * @returns {Promise} A promise that TODO
   */
  add(thunk) {
    if (this._ready) {
      return thunk();
    }
    else if (this._failed) {
      return Promise.reject(this._error);
    }
    else {
      return new Promise((resolve, reject) => {
        this._queue.push({ thunk, resolve, reject });
      });
    }
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = RequestHandler;
