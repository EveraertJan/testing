'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const config = require('config');
const log4js = require('log4js');

// -------------------------------------------------------------------------------------------------

/**
 * Base class for Consumer and Producer classes.
 */
class Client {

  /**
   * @param {string} clientId - The clientId.
   * @param {log4js} log - The logger.
   */
  constructor(clientId, log) {
    this._brokers = config.get('kafka.brokers');
    this._clientId = clientId;
    this._log = log || log4js.getLogger('broker.Client');
  }

  get brokers() { return this._brokers; }
  get clientId() { return this._clientId; }
  get log() { return this._log; }

  /**
   * Returns a promise that check whether the given topic already exists.
   * @param {string} topic - The topic.
   * @returns {Promise}
   */
  checkTopic(topic) {
    const log = this.log;
    const self = this;
    //log.trace('>> BaseClient.checkTopic');
    try {
      return new Promise(function (resolve, reject) {
        self.getTopics().then(function (topics) {
          //log.debug('- topics:', topics);
          if (topics.indexOf(topic) >= 0) {
            resolve();
          }
          else {
            reject(`The topic '${topic}' is not available in the broker.`);
          }
        });
      });
    }
    catch (error) {
      log.error('Unexpected error [in cargo-lib.broker.Client.checkTopic]');
      log.error(error.stack);
    }
  }

  /**
   * Returns a promise that retrieves the current broker topics are passes the resulting array of
   * string to the `then` handler.
   * @returns {Promise}
   */
  getTopics() {
    const log = this.log;
    const self = this;
    //log.trace('>> BaseClient.getTopics');
    try {
      return new Promise(function (resolve, reject) {
        self._kafkaClient.updateMetadata().then(
          function () {
            //log.trace('- topicMetadata:', self._kafkaClient.topicMetadata);
            resolve(Object.keys(self._kafkaClient.topicMetadata));
          },
          function (err) {
            reject(`Failed to get the broker topics. ${err}`);
          }
        );
      });
    }
    catch (error) {
      log.error('Unexpected error [in cargo-lib.broker.Client.getTopics]');
      log.error(error.stack);
    }
  }
}

module.exports = Client;
