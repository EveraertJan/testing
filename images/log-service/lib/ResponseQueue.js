'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const EventEmitter = require('events');

const trimMsg = require('cargo-lib/utils/trimMsg');

// -------------------------------------------------------------------------------------------------

const ENQUEUED = 1;
const RETRACTED = 2;

/**
 * Enqueues events that, after the given delay, are dequeued, emitting a `timeout` event. Enqueued
 * events can be retracted from the queue.
 *
 * All operations are O(1).
 *
 * This class emits the following events:
 * - timeout : Emitted when a response timed out.
 */
class ResponseQueue extends EventEmitter {

  /**
   * @param {int} delay - The delay in milliseconds.
   * @param {Logger} log - The logger object.
   */
  constructor(delay, log) {
    this.delay = delay;
    this.log = log;

    this._queue = [];
    this._map = new Map();
    this._timer = null;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Main methods:

  /**
   * Add an event to the queue.
   *
   * @param {Object} event
   */
  add(event) {
    if (this._map.has(event)) {
      throw new Error(`The given event is already enqueued. Event.eventId: ${event.eventId}`);
    }
    this._map.set(event, ENQUEUED);
    this._queue.push({
      timeout: Date.now() + this.delay,
      event: event
    });
    if (!this._timer) {
      this._timer = setTimeout(this._onTimeout.bind(this), this.delay);
    }
  }

  /**
   * Retracts the given event from the queue.
   *
   * @param {Object} event
   * @returns {boolean} True when the given event was enqueued and is now retracted, false otherwise.
   */
  retract(event) {
    if (this._map.has(event) && this._map.get(event) == ENQUEUED) {
      this._map.set(event, RETRACTED);
      return true;
    }
    else { return false; }
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // System methods:

  /** @private */
  _onTimeout() {
    this._timer = null;
    this._dequeue(this._queue.shift());
    while (this._queue.length > 0) {
      let dt = this._queue[0].timeout - Date.now();
      if (dt <= 0) {
        this._dequeue(this._queue.shift());
      }
      else {
        this._timer = setTimeout(this._onTimeout.bind(this), dt);
        break;
      }
    }
  }

  /** @private */
  _dequeue(event) {
    if (this._map.has(event)) {
      if (this._map.get(event) == ENQUEUED) {
        this._map.delete(event);
        this.emit('timeout', event);
      }
      else {
        this._map.delete(event);
      }
    }
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = ResponseQueue;
