'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const _ = require('lodash');
const log4js = require('log4js');

const Client = require('./Client');

// -------------------------------------------------------------------------------------------------

const log = log4js.getLogger('broker/redis/Subscriber');

/**
 * Subscribes to data streams on the stream broker.
 */
class Subscriber extends Client {

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Client method overrides:

  /**
   * @inheritdoc
   */
  init() {
    //log.trace(`>> Subscriber.init()`);
    return super.init()
      .then(client => {
        client.redisClient.on('message', (channel, message) => {
          //log.debug('msg:', message);

          // Parse the message string as JSON:
          let event;
          try {
            message = JSON.parse(message);
          }
          catch(error) {
            let msg = `Failed to parse JSON message from channel '${channel}'.`;
            msg += `\n${error}\nMessage: ${message}`;
            log.error(msg);
            return;
          }

          this.emit('message', channel, message);
        });

        return Promise.resolve(client);
      });
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Public methods:

  /**
   * Returns a promise that subscribes the client to the given channel(s).
   *
   * @param {String|Array} channels - One channel name or an array of channel names.
   * @param {Object} [options] - Currently not used in Redis Subscriber.
   * @param {function} [handler] - A function that is called for each message received by the
   *          broker client. The handler is called with two arguments: the channel (a string) and
   *          the message (a JSON object).
   * @returns {Promise} A promise that subscribes and resolves to the Subscriber instance.
   */
  subscribe(channels, options, handler) {
    //log.trace(`>> Subscriber.subscribe(${channels})`);

    return new Promise((resolve, reject) => {
      if (!this.redisClient) {
        return reject('The Redis Subscriber client is not properly initialized.');
      }

      if (_.isFunction(options)) { this.on('message', options); }
      else if (_.isFunction(handler)) { this.on('message', handler); }

      this.redisClient.subscribe(channels, (error, result) => {
        // Note: the value of `result` is the channel name.
        if (error) {
          if (!_.isError(error)) { error = new Error(error); }
          error.message = `Failed to subscribe to Redis channels ${channels}. ${error.message || error}`;
          log.error(error);
          reject(error);
        }
        else {
          log.trace(`Redis Subscriber subscribed to channel '${result}'`);
          resolve(this);
        }
      });
    });
  }

  /**
   * Returns a promise that unsubscribes the client from all the previously subscribed to channels.
   *
   * @param {String|Array} channels - One channel name or an array of channel names.
   * @returns {Promise}
   */
  unsubscribe(channels) {
    return new Promise((resolve, reject) => {
      this.redisClient.unsubscribe(channels, (error, result) => {
        if (error) {
          if (!_.isError(error)) { error = new Error(error); }
          error.message = `Failed to unsubscribe the Redis client. ${error.message || error}`;
          log.error(error);
          reject(error);
        }
        else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Returns a promise that unsubscribes the client from all the previously subscribed to channels.
   *
   * Quits the redis client. The client is no longer available after calling this method.
   * @returns {Promise} The promise, which resolves to the Subscriber instance.
   */
  end() {
    return new Promise((resolve, reject) => {
      //log.debug(`Ending subscriber.`);
      const redisClient = this.redisClient;
      this.deleteRedisClient();

      // Remove handlers:
      this.removeAllListeners();
      redisClient.removeAllListeners('message');

      // Unsubscribe from all channels.
      redisClient.unsubscribe((error) => {

        // report unsubscribe error:
        if (error) {
          log.error(`Failed to unsubscribe the Redis client. ${error}`);
          if (error.stack) { log.error(error.stack); }
        }

        // Remove the `end` handler added in redis/Client._monitorRedisClient.
        redisClient.removeAllListeners('end');

        // Add the final `end` handler:
        redisClient.on('end', () => {
          //log.debug(`The redis client ended expectedly.`);

          // Remove all listeners on the Redis client.
          redisClient.removeAllListeners();

          resolve(this);
        });

        redisClient.quit();
      });
    });
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = Subscriber;
