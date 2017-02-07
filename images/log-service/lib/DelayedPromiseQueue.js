'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');

const _ = require('lodash');
const Promise = require('bluebird');

// -------------------------------------------------------------------------------------------------

/**
 * @typedef {Object} Result
 * @property {*} key - The given key, of the data object when no key is given.
 * @property {*} data - The data object.
 * @property {Number} time - The unix/epoch time when the entry expires.
 * @property {boolean} retracted - True when the entry was retracted before expiring.
 * @property {*} reason - The given reason when the entry is retracted, see {@link retract} .
 */

/**
 * When you add a data object in this queue you get a promise back. This promise will resolve when
 * a given delay expires or when you retract the entry before it expires. The resulting value is a
 * {@link Result} object.
 *
 * This queue is a more efficient alternative for using a separate timeout for each delayed item.
 * It uses only one timout and all operations are O(1).
 */
class DelayedPromiseQueue {

  /**
   * @param {int} delay - The delay after which entries expire, in milliseconds.
   */
  constructor(delay, log) {
    assert(_.isNumber(delay), `The given delay is not a number, got: ${delay}`);
    this.delay = delay;
    this.log = log;

    this._queue = [];  // the entries array, sorted by expiration time
    this._map = new Map(); // a map for O(1) lookup when retracting entries
    this._timer = null;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Main methods:

  /**
   * Add a data object to the queue and return a promise that is resolved when the delay expires, or
   * when the entry is retracted before it expires. The resulting value is a {@link Result} object.
   *
   * @param {*} [key] - The key with which to retract the data object from the queue. When no key is
   *            given, then the data object itself is taken as the key.
   * @param {*} data - The data object to enqueue.
   * @returns {Promise}
   */
  add(key, data) {
    assert(!_.isUndefined(key), `The given key is undefined, got: ${key}`);
    //this.log.debug('>> DelayedPromiseQueue.add()', key, data);

    if (_.isUndefined(data)) { data = key; }

    if (this.enqueued(key)) {
      throw new Error(`There is already an entry in the queue with the given key:`,
        this._map.get(key).data);
    }

    const entry = {
      key: key,
      data: data,
      retracted: false,
      time: Date.now() + this.delay
    };
    const promise = new Promise(resolve => entry.resolve = resolve);

    this._map.set(key, entry);
    this._queue.push(entry);
    if (!this._timer) {
      this._timer = setTimeout(this._onTimeout.bind(this), this.delay);
    }

    return promise;
  }

  /**
   * @param key
   * @returns {boolean} True when there is an entry in the queue for the given key.
   */
  enqueued(key) {
    assert(!_.isUndefined(key), `The given key is undefined (in enqueue), got: ${key}`);
    return this._map.has(key) && !this._map.get(key).retracted;
  }

  /**
   * Retracts the entry with the given key from the queue. This key is matched against the key given
   * when the entry was added or the data object when no key was given (see {@link add}).
   *
   * @param {*} key
   * @param {*} [reason] - Optional reason which is added as the 'reason' property in the result
   *            object to which the entry's promise resolves.
   * @returns {boolean} True when the given data object was enqueued and is now retracted, false
   *          otherwise.
   */
  retract(key, reason) {
    assert(!_.isUndefined(key), `The given key is undefined (in retract), got: ${key}`);
    //this.log.debug('>> DelayedPromiseQueue.retract', key, this.enqueued(key));
    if (this.enqueued(key)) {
      const entry = this._map.get(key);
      this._map.delete(key);
      entry.retracted = true;
      entry.reason = reason;
      this._resolve(entry);  // resolve the promise for the retracted entry
      return true;
    }
    else { return false; }
  }

  /**
   * Marks the queue-entry with the given key as matched.
   *
   * @param {*} key
   * @param {*} [reason] - Optional reason which is added as the 'reason' property in the result
   *            object to which the entry's promise resolves.
   * @returns {boolean} True when there is an entry for the given key, false otherwise.
   */
  matched(key, reason) {
    assert(!_.isUndefined(key), `The given key is undefined (in matched), got: ${key}`);
    //this.log.debug('>> DelayedPromiseQueue.matched', key);
    //this.log.debug('reason:', reason);
    if (this.enqueued(key)) {
      const entry = this._map.get(key);
      //this.log.debug('entry.data.events:', entry.data.events);
      entry.matched = true;
      entry.reason = reason;

      // When there is only one event in the report, then the entry is retracted and the delayed
      // promise is resolved immediately.
      if (entry.data.events.length == 1) {
        this._map.delete(key);
        entry.retracted = true;
        this._resolve(entry);  // resolve the promise for the fully matched entry
      }
      return true;
    }
    else { return false; }
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // System methods:

  /** @private */
  _onTimeout() {
    clearTimeout(this._timer);
    this._timer = null;
    while (this._queue.length > 0) {
      let dt = this._queue[0].time - Date.now();  // delta time
      if (dt <= 0) {
        const entry = this._queue.shift();
        this._map.delete(entry.key);
        if (!entry.retracted) { this._resolve(entry); }  // resolve promise for expired entries
      }
      else {
        this._timer = setTimeout(this._onTimeout.bind(this), dt);  // set timeout for the next entry
        break;
      }
    }
  }

  /** @private */
  _resolve(entry) {
    const resolve = entry.resolve;
    delete entry.resolve;
    resolve(entry);  // resolve the promise returned when this entry was added
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = DelayedPromiseQueue;
