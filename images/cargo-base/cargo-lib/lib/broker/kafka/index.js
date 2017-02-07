'use strict';

/**
 * @todo: This kafka broker implementation needs to be updated.
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Consumer = require('./Consumer');
const Producer = require('./Producer');

// -------------------------------------------------------------------------------------------------

const FTPROMISE_CONFIG = {
  factor: 1,
  minTimeout: 2000
};

const PARTITION = 0;

// -------------------------------------------------------------------------------------------------

/**
 * Represents the data stream broker in the backend.
 */
module.exports = {

  Consumer: Consumer,

  Producer: Producer,

  /**
   * Initialize a Kafka consumer.
   * @param {string} clientId - The clientId.
   * @param {log4js} log - The logger.
   * @returns {Promise} A promise that resolves to a Consumer object.
   */
  initConsumer: function (clientId, log) {
    return new Consumer(clientId, log).init();
  },

  /**
   * Initialize a Kafka producer.
   * @param {string} clientId - The clientId.
   * @param {log4js} log - The logger.
   * @returns {Promise} A promise that resolves to a Producer object.
   */
  initProducer: function (clientId, log) {
    return new Producer(clientId, log).init();
  }

};
