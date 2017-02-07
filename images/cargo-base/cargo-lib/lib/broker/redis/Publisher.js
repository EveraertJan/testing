'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const _ = require('lodash');
const log4js = require('log4js');
const redis = require('redis');

const trimMsg = require('../../../utils/trimMsg');

const Client = require('./Client');

// -------------------------------------------------------------------------------------------------

const log = log4js.getLogger('broker/redis/Publisher');

/**
 * Publishes messages on the Redis broker.
 */
class Publisher extends Client {

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Public methods:

  /**
   * Returns a promise that publishes the given message(s) on the given channel.
   *
   * @param {String} channel - The channel name.
   * @param {JSON|Array} messages - A single or an array of JSON message objects.
   * @returns {Promise}
   */
  publish(channel, messages) {
    //log.trace(`Publishing messages on channel '${channel}'`);

    if (_.isObject(messages) && !_.isArray(messages)) { messages = [messages]; }
    else if (_.isString(messages)) { messages = [messages]; }

    return Promise.all(messages.map(message => new Promise((resolve, reject) => {
      if (_.isObject(message)) {
        message = JSON.stringify(message);
      }
      this.redisClient.publish(channel, message, (error, result) => {
        if (error) {
          if (!_.isError(error)) { error = new Error(error); }
          error.message = `Failed to publish a message. ${error.message || error}`;
          log.error(error);
          reject(error);
        }
        else {
          log.trace(`Published on '${channel}': ${trimMsg(message)}`);
          resolve(result);
        }
      });
    })));
  }

  /**
   * @returns {Promise} A promise that ends the Redis publisher client.
   */
  end() {
    return new Promise((resolve, reject) => {
      //log.debug(`Ending Redis publisher.`);
      const redisClient = this.redisClient;
      this.deleteRedisClient();

      // Remove handlers:
      this.removeAllListeners();

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
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = Publisher;
