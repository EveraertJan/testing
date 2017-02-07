'use strict';

/**
 * @module cargo-lib/CargoApp
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');
const EventEmitter = require('events');

const Promise = require('bluebird');
const cargoApi = require('../api/cargoAPI');
const yaml = require('js-yaml');
const _ = require('lodash');
const log4js = require('log4js');

const ServerManager = require('../api/ServerManager');
const fs = require('../utils/fs');
const prependError = require('../utils/prependError');

const config = require('./config.js');  // Load this first
const Broker = require('./broker/redis/Broker');

const log = log4js.getLogger('CargoApp');

/**
 * Base class for Cargo services.
 */
class CargoApp extends EventEmitter {

  /**
   * @param {boolean} [disableAuth = false] - Disables authorization functionality, which, obviously
   *        should be used with the greatest care.
   */
  constructor({ disableAuth = false } = {}) {
    super();

    if (process.env.QUIET === 'true') {
      log4js.setGlobalLogLevel(log4js.levels.ERROR);
    }
    else if (process.env.VERBOSE === 'true') {
      log4js.setGlobalLogLevel(log4js.levels.DEBUG);
    }

    this._configureExit();  // First configure exit handling

    this._manifest = this._loadManifest();  // Load the cargo manifest
    this._log = log4js.getLogger(this.manifest.service);
    this._config = config;

    //log.info(`Constructing '${this.service}' App...`);

    // Array of functions that, when called, return a promise. When the app stops, these
    // functions are called and the resulting promises are awaited.
    this._stopTasks = [];

    this._broker = new Broker();
    this._serverManager = new ServerManager({
      disableAuth,
      service: this.service
    });
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Accessors:

  /** @returns {String} The name of the service. */
  get service() { return this.manifest.service; }

  /** @returns {Logger} The log4js logger object for this app. */
  get log() { return this._log; }

  /** @returns {Object} The cargo manifest for this service. */
  get manifest() { return this._manifest; }

  /** @returns {Object} The configuration for this service. */
  get config() { return this._config; }

  /** @returns {Broker} The broker client for this service. */
  get broker() { return this._broker; }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Main methods:

  /**
   * Returns a promise that starts the app.
   * @param {Object} opts
   * @returns {Promise}
   */
  start(opts) {
    //console.time('CargoApp.start()');
    return Promise.coroutine(
      function* () {
        //log.info(`Starting '${this.service}' app...`);
        yield this._delay();

        // Add the basic Cargo API:
        cargoApi.initCargoApi(this);

        // Call onStart() in deriving App class:
        yield* this.onStart();

        // Start the API servers:
        yield this._serverManager.startServers();

        log.info(`Started '${this.service}' app.`);
        //console.timeEnd('CargoApp.start()');
        return this;
      }.bind(this)
    )()
      .catch((error) => {
        error = prependError(error, `Failed to start the ${this.service} app.`);
        log.error(error);
        process.exit(201);
      });
  }

  /**
   * Returns a promise that stops the app, closing all the resources this app was using. When this
   * promise resolves, the app should be in a state that allows the app to be started again when
   * {@link start} is called again.
   * @returns {Promise}
   */
  stop() {
    //log.info(`Stopping '${this.service}' app...`);
    //console.time('CargoApp.start()');
    return Promise.coroutine(
      function* () {
        yield this._serverManager.stopServers();
        yield Promise.each(this._stopTasks, (t) => t());
        yield* this.onStop();
        log.info(`Stopped '${this.service}' app.`);
        return this;
      }.bind(this))()
      .catch((error) => {
        error = prependError(error, `Failed to stop the '${this.service}' app.`);
        log.error(error);
        //process.exit(0);
      });
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Event handlers to override:

  /**
   * This generator methods is called during the startup process initiated when calling CargoApp.start.
   * Override the *onStart generator method in concrete subclasses of the CargoApp class. The
   * implementation of the *onStart generator method can use yield to yield promises. Control is
   * returned back to the generator when the yielded promise settles. The return value of such yield
   * is the result the promise resolved to.
   *
   * @example
   * *onStart() {
   *   const value = yield aPromise;
   *   yield anotherPromise;
   * }
   *
   * The *onStart generator methods is called using yield* from a generator function passed to
   * bluebird.coroutine().
   */
  *onStart() {}

  /**
   * This generator methods is called during the app termination process.
   * Override the *onStop generator method in concrete subclasses of the CargoApp class. The
   * implementation of the *onStop generator method can use yield to yield promises. Control is
   * returned back to the generator when the yielded promise settles. The return value of such yield
   * is the result the promise resolved to.
   *
   * @example
   * *onStop() {
   *   const value = yield aPromise;
   *   yield anotherPromise;
   * }
   *
   * The *onStop generator methods is called using yield* from a generator function passed to
   * bluebird.coroutine().
   */
  *onStop() {}

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // API-server functionality:

  /**
   * @see APIServer#serveApi
   * @returns {CargoApp} The app such that this method can be chained.
   */
  serveApi(opts, initializer) {
    this._serverManager.serveApi(opts, initializer);
    return this;
  }

  /**
   * @see APIServer#serveSecureApi
   * @returns {CargoApp} The app such that this method can be chained.
   */
  serveSecureApi(opts, initializer) {
    this._serverManager.serveSecureApi(opts, initializer);
    return this;
  }

  /**
   * @see APIServer#serveFolder
   * @returns {CargoApp} The app such that this method can be chained.
   */
  serveFolder(opts) {
    this._serverManager.serveFolder(opts);
    return this;
  }

  /**
   * @see APIServer#serveReact
   * @returns {CargoApp} The app such that this method can be chained.
   */
  serveReact(opts) {
    this._serverManager.serveReact(opts);
    return this;
  }

  /**
   * @see APIServer#serveWebSocket
   * @returns {CargoApp} The app such that this method can be chained.
   */
  //serveWebSocket(opts, initializer) {
  //  return this._serverManager.serveWebSocket(opts, initializer);
  //return this;
  //}

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Helper methods:

  /**
   * Helper method that takes a generator function and an error message. This method calls the
   * BlueBird coroutine function with the given generator function with this being bound to the app
   * instance. Caught errors are prepended with the given error message.
   * @param {Function} genFn - The generator function to pass to Bluebird's `Promise.coroutine()`.
   * @param {String} [errorMsg] - The error message to prepend to errors.
   * @returns {Promise.<*>}
   * @see http://bluebirdjs.com/docs/api/promise.coroutine.html
   */
  co(genFn, errorMsg) {
    return Promise.coroutine(genFn.bind(this))()
      .catch((error) => prependError(error, errorMsg));
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // System methods:

  /** @private */
  _configureExit() {
    // Triggered when hitting CTRL-C. Try to exit gracefully.
    process.on('SIGINT', process.exit);

    // Triggered on Windows when the console window is closed, and on other platforms under various
    // similar conditions. Try to exit gracefully.
    process.on('SIGHUP', process.exit);

    // Try to exit gracefully.
    process.on('exit', code => {
      if (code != 0) {
        log.error(`Terminated unexpectedly with code ${code}.`);
      }
      else {
        log.info('Terminated normally');
      }
      this.stop();
    });
  }

  /** @private */
  _loadManifest() {
    const MANIFEST_PATH = '/cargo/cargo.yaml';
    const MANIFEST_DEFAULTS_PATH = '/cargo/cargo-lib/lib/cargo.defaults.yaml';
    let manifest = null;
    let defaultManifest = null;
    try {
      manifest = yaml.safeLoad(fs.readFileSync(MANIFEST_PATH));
    }
    catch (error) {
      log.fatal(`Failed to read the cargo manifest from '${MANIFEST_PATH}'. ${error.message || error}`);
      process.exit(-1);
    }

    try {
      defaultManifest = yaml.safeLoad(fs.readFileSync(MANIFEST_DEFAULTS_PATH));
    }
    catch (error) {
      log.fatal(`Failed to read the default cargo manifest from '${MANIFEST_DEFAULTS_PATH}'.`,
        error.message);
      process.exit(-1);
    }

    //log.debug('manifest:', manifest);
    //log.debug('defaultManifest:', defaultManifest);
    manifest = _.defaults(manifest, defaultManifest);
    //log.debug('manifest:', manifest);
    checkManifest(manifest);
    return manifest;
  }

  /**
   * Returns a promise that waits some time and then resolves to the given result. The delay duration
   * is determined by the value of the CARGO_DELAY environment variable, the value of which is
   * interpreted as the number of seconds to wait, expressed as a float.
   * @param {*} [result] - The result the promise resolves to.
   * @returns {Promise}
   * @private
   */
  _delay(result) {
    let delay = 0;
    if (process.env.CARGO_DELAY) {
      //log.debug('process.env.CARGO_DELAY:', process.env.CARGO_DELAY);
      delay = parseFloat(process.env.CARGO_DELAY);
    }
    if (process.env.CARGO_DELAY_OVERRIDE) {
      //log.debug('process.env.CARGO_DELAY_OVERRIDE:', process.env.CARGO_DELAY_OVERRIDE);
      delay = parseFloat(process.env.CARGO_DELAY_OVERRIDE);
    }
    if (delay > 0) {
      return new Promise(resolve => {
        setTimeout(() => resolve(result), delay * 1000);
      });
    }
    else {
      return Promise.resolve(result);
    }
  }

}

/** @private */
function checkManifest(manifest) {
  assert(_.isObject(manifest), 'The manifest must be an object.');
  assert(_.isString(manifest.service),
    'The `manifest.service` property must provide the service name, as a string.');
  assert(_.isBoolean(manifest.cargoApp), 'The `manifest.cargoApp` property must be a boolean.');
  assert(_.isBoolean(manifest.cargoFrontend), 'The `manifest.cargoFrontend` property must be a boolean.');
  assert(_.isBoolean(manifest.watchable), 'The `manifest.watchable` property must be a boolean.');

  assert(_.isObject(manifest.unitTests), 'The `manifest.unitTests` property must be an object.');
  assert(_.isBoolean(manifest.unitTests.enable), 'The `manifest.unitTests.enable` property must be a boolean.');
}

module.exports = CargoApp;
