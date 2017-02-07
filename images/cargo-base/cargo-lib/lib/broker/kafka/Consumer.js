'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const ftpromise = require('retrying-promise');
const kafka = require('no-kafka');

const Client = require('./Client');

// -------------------------------------------------------------------------------------------------

const FTPROMISE_CONFIG = {
  factor: 1,
  minTimeout: 2000
};

// -------------------------------------------------------------------------------------------------

/**
 * Subscribes to data streams on the Kafka broker.
 */
class Consumer extends Client {

  /**
   * @param {string} clientId - The clientId.
   * @param {log4js} log - The logger.
   */
  constructor(clientId, log) {
    super(clientId, log);
  }

  /**
   * @returns {Promise} A promise that initializes the consumer and resolves to it.
   */
  init() {
    const log = this.log;
    const self = this;
    try {
      log.trace('Initializing the Kafka consumer');
      const options = {
        connectionString: self.brokers,
        clientId: this.clientId
      };
      this._consumer = new kafka.SimpleConsumer(options);
      this._kafkaClient = this._consumer.client;

      return ftpromise(FTPROMISE_CONFIG, function (resolve, retry, reject) {
        self._consumer.init().then(
          function () {
            log.trace('Consumer initialized');
            resolve(self);
          },
          function (error) {
            log.error(`Failed to initialize the consumer. ${error}`);
            log.error(`This is probably due to Kafka or ZooKeeper not being ready yet. Trying again later.`);
            //log.error(error.stack);
            retry(error);
          }
        );
      });
    }
    catch (error) {
      log.error('Unexpected error [in cargo-lib.broker.Consumer.init]');
      log.error(error.stack);
    }
  }

  /**
   * @param {string} topic - The topic.
   * @param {Object} options
   * @param {function} msgHandler - A function that is called for each message received by the
   *            broker client.
   * @returns {Promise} A promise that subscribes and resolves to the consumer instance.
   */
  subscribe (topic, options, msgHandler) {
    //log.trace(`Kafka.consumer initialized`);
    const log = this.log;
    const self = this;
    const partition = 0;
    const dataHandler = function (messageSet, topic, partition) {
      //log.debug('subscriber > dataHandler > messageSet:', messageSet);
      messageSet.forEach(function (msg) {
        //log.debug('>>> msg:', msg);
        try {
          msg = msg.message.value.toString('utf8');
        }
        catch (err) {
          log.error('Failed to parse the message received from the broker.');
          log.error(`Message: ${msg}`);
          log.error(err.stack);
          throw err;
        }
        try {
          msgHandler(msg, partition);
        }
        catch (err) {
          log.error('The given broker message handler failed.');
          log.error(`Message: ${msg}`);
          log.error(err.stack);
          throw err;
        }
      });
    };

    return this._consumer.subscribe(topic, partition, options, dataHandler).then(
      function () {
        log.trace(`The broker client subscribed to '${topic}'`);
        return Promise.resolve(self);
      },
      function (error) {
        if (error.code == 'UnknownTopicOrPartition') {
          // requested a topic or partition that does not exist on the broker
          return Promise.reject(`The given topic (${topic}) or partition (${partition}) is not valid. ${error}`);
        }
        else {
          log.error('broker.Client.subscribe() failed. ' + error.message);
          log.error('- typeof err:', typeof error);
          log.error('- err.name:', error.name);
          log.error('- err.code:', error.code);
          log.error('- err.message:', error.message);
          log.error('- err.data:', error.data);
          return Promise.reject('Failed to subscribe the consumer. ' + error);
        }
      }
    );
  }

  end() {
    //const log = this.log;
    this._consumer.end();
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = Consumer;
