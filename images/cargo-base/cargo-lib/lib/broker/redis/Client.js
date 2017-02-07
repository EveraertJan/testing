'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const EventEmitter = require('events');

//const Promise = require('bluebird');
const config = require('config');
const log4js = require('log4js');
const redis = require('redis');
const ftpromise = require('retrying-promise');

// -------------------------------------------------------------------------------------------------

const FTPROMISE_CONFIG = {
  factor: 1,
  minTimeout: 2000
};

// -------------------------------------------------------------------------------------------------

/**
 * Base class for Redis Subscriber and Publisher classes.
 */
class Client extends EventEmitter {

  /**
   * @param {log4js} log - The logger.
   */
  constructor(log) {
    super();
    this._log = log || log4js.getLogger('broker.Client');
    this._host = config.get('soyl.redis.host');
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Accessors:

  /** @returns {Logger} The logger object. */
  get log() { return this._log; }

  /** @returns {Object} The redis client from the `redis` package. */
  get redisClient() { return this.redis; }

  /** Deletes the Redis client. */
  deleteRedisClient() { delete this.redis; }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Public methods:

  /**
   * @returns {Promise} A promise that initializes the redis client and resolves to the Client
   *          instance.
   */
  init() {
    try {
      //this.log.trace('Initializing the redis client');

      return ftpromise(FTPROMISE_CONFIG, (resolve, retry, reject) => {
        const options = {
          host: this._host
        };

        this.redis = redis.createClient(options);

        // The initial `ready` handler:
        this.redis.on('ready', msg => {
          //this.log.trace("Redis client is ready");

          // Now that the client is ready, we can remove the initial `ready` and `error` handlers
          // and start monitoring the client:
          this.redis.removeAllListeners('ready');
          this.redis.removeAllListeners('error');
          this._monitorRedisClient();

          resolve(this);
        });

        // The initial `error` handler:
        this.redis.on('error', error => {
          this.log.error(`Failed to initialize the redis client. ${error}`);
          this.redis.removeAllListeners();
          retry(error);
        });
      });
    }
    catch (error) {
      this.log.error('Unexpected error [in cargo-lib.broker.redis.Client.init]');
      this.log.error(error.stack);
    }
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // System methods:

  /** @private */
  _monitorRedisClient() {
    // connect handler:
    this.redis.on('connect', () => {
      this.log.error(`The redis client reconnected.`);
    });

    // reconnecting handler:
    this.redis.on('reconnecting', (options) => {
      this.log.error(`The redis client is trying to reconnect (delay: ${options.delay}, attempt #${options.attempt}`);
    });

    // error handler:
    this.redis.on('error', (error) => {
      this.log.error(`The redis client erred. ${error}`);
      this.emit('error', error);
    });

    // end handler:
    this.redis.on('end', () => {
      this.log.error(`The redis client ended unexpectedly.`);
    });

    // warning handler:
    this.redis.on('warning', (warning) => {
      this.log.error(`The redis client warns: ${warning}.`);
    });

  }

}

// -------------------------------------------------------------------------------------------------

module.exports = Client;
