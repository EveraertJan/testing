'use strict';

/**
 * The main script in the cargo-lib module.
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const log4js = require('log4js');

// -------------------------------------------------------------------------------------------------

class CargoLib {

  constructor () {

    /** @property {Object} The config object. */
    this._config = require('./config.js'); // Important: Load the config before loading other assets!

    /** @property {App} The App base class. */
    this._CargoApp = require('./CargoApp');

    /** @property {Object} Cargo.utils object. */
    this._utils = require('./utils');

    /** @property {StoreManager} The StoreManager. */
    this._storeManager = new (require('./store/StoreManager'))();

    // Initialize the store manager:
    this._storeManager.registerStoreType('OrientDB.basic', require('./store/orientdb/OrientDbStore'));
    this._storeManager.registerStoreType('Postgres.basic', require('./store/postgres/PostgresStore'));
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Accessors:

  /**
   * @returns {CargoApp} The CargoApp class.
   * @constructor
   */
  get CargoApp() { return this._CargoApp; }

  /**
   * @returns {Object} The config object.
   */
  get config() { return this._config; }

  /**
   * @returns {StoreManager} The store manager singleton.
   */
  get storeManager() { return this._storeManager; }

  /**
   * @returns {Object} The utils object.
   */
  get utils() { return this._utils; }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Utilities:

  /**
   * @returns {log4js.logger} A logger object.
   */
  getLogger(label) {
    const log = log4js.getLogger(label);
    let level = log4js.levels.INFO;
    if (process.env.QUIET === 'true') {
      level = log4js.levels.ERROR;
    }
    else if (process.env.VERBOSE === 'true') {
      level = log4js.levels.DEBUG;
    }
    log.setLevel(level);
    return log;
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = new CargoLib();
