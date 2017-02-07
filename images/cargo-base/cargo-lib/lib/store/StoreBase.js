'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require("bluebird");

// -------------------------------------------------------------------------------------------------

/**
 * Base class for data store classes.
 */
class StoreBase {

  /**
   * @param {string} type - Unique id of the data store.
   */
  constructor (type) {
    this._type = type;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * @returns {boolean} true
   */
  get isStore() { return true; }

  /**
   * @returns {string} Unique id of the data store type.
   */
  get type() { return this._type; }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Methods to implement:

  /**
   * Returns a promise that initializes the data store.
   * @param {*} opts - The options.
   * @returns {Promise}
   */
  init(opts) {
    return Promise.reject(`Missing implementation of the init() method in the '${this._type}' data store class.`);
  }

  /**
   * Returns a promise that stops the store.
   * @returns {Promise}
   */
  stop() {
    return Promise.reject(`Missing implementation of the stop() method in the '${this._type}' data store class.`);
  }

  /**
   * Returns a promise that deletes the store.
   * @returns {Promise}
   */
  drop() {
    return Promise.reject(`Missing implementation of the drop() method in the '${this._type}' data store class.`);
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = StoreBase;
