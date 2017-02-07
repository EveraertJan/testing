'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const log4js = require('log4js');

const prependError = require('../../utils/prependError');

const StoreBase = require('./StoreBase');

// -------------------------------------------------------------------------------------------------

const log = log4js.getLogger('StoreManager');

class StoreManager {

  constructor () {
    this._types = new Map();
  }

  /**
   * Returns a promise that registers a new data store type.
   *
   * @param {string} type - Unique type of the data store.
   * @param {StoreBase} storeClass - The data store class, which must extend {@link StoreBase}.
   * @returns {Promise}
   */
  registerStoreType(type, storeClass) {
    return new Promise((resolve, reject) => {
      if (this._types.has(type)) {
        return reject(`There is already a data store with type '${type}' in the Cargo StoreManager.`);
      }
      this._types.set(type, storeClass);
      resolve();
    });
  }

  /**
   * Returns a promise that initializes and resolves to a new data store object.
   *
   * @param {string} type - The data store type.
   * @param {*} opts - The options passed to the store class constructor.
   * @returns {Promise}
   */
  initStore(type, opts) {
    if (!this._types.has(type)) {
      return Promise.reject(new Error(`There is no data store with type '${type}' in the Cargo StoreManager.`));
    }

    const storeClass = this._types.get(type);

    let store = null;
    try {
      store = new storeClass(type);
    }
    catch (error) {
      return Promise.reject(prependError(error, `Failed to initialize the store.`));
    }
    try {
      return store.init(opts)
        .then(() => {
          log.trace(`Initialized '${type}' store.`);
          return store;
        });
    }
    catch (error) {
      return Promise.reject(prependError(error, `Unexpected error when calling StoreManager.initStore().`));
    }
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = StoreManager;
