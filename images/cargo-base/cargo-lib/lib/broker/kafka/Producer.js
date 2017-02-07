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
 * Publishes messages on the Kafka broker.
 */
class Producer extends Client {

  /**
   * @param {string} clientId - The clientId.
   * @param {log4js} log - The logger.
   */
  constructor(clientId, log) {
    super(clientId, log);
  }

  /**
   * @returns {Promise} A promise that initializes the producer and resolves to it.
   */
  init() {
    const log = this.log;
    const self = this;
    try {
      const options = {
        connectionString: self.brokers,
        clientId: this.clientId
      };
      this._producer = new kafka.Producer(options);
      this._kafkaClient = this._producer.client;

      return ftpromise(FTPROMISE_CONFIG, function (resolve, retry, reject) {
        self._producer.init().then(
          function () { resolve(self); },
          function (error) {
            log.error(`Failed to initialize the producer. ${error}`);
            log.error(`This is probably due to Kafka or ZooKeeper not being ready yet. Trying again later.`);
            //log.error(error.stack);
            retry(error);
          }
        )
      });
    }
    catch (error) {
      log.error('Unexpected error [in cargo-lib.broker.Producer.init]');
      log.error(error.stack);
    }
  }

    //.then(function () {
    //  self.checkTopic(self.topic).then(
    //    function () {
    //      resolve(self);
    //    },
    //    function (error) {
    //      log.error(`Failed to initialize the publisher. ${error}`);
    //      log.error(`This is probably due to Kafka or ZooKeeper not being ready yet. Trying again later.`);
    //      log.error(error.stack);
    //      retry(error);
    //    }
    //  )
    //});

  /**
   * @param {string} topic - The topic.
   * @param {Object} options
   * @param {Array|string} values - The message values to publish.
   * @returns {Promise} A promise that resolves to the response or the array of responses.
   */
  publish(topic, options, values) {
    const log = this.log;
    const self = this;
    //log.trace(`Publishing value under topic '${topic}'`);

    const partition = 0;
    let data;
    if (typeof values == 'string') {
      data = [{
        topic: topic,
        partition: partition,
        message: { value: values }
      }];
    }
    else {
      data = values.map(function (value) {
        return {
          topic: topic,
          partition: partition,
          message: { value: value }
        }
      });
    }

    return new Promise(function (resolve, reject) {
      self._producer.send(data).then(
        function (responses) {
          //log.debug('Responses from Kafka:', responses);
          if (responses.length == 1) {
            const resp = responses[0];
            if (resp.error) {
              reject(`${resp.error.name}: ${resp.error.code}: ${resp.error.message}`);
            }
            else { resolve(resp); }
          }
          else {
            let someFailed = false;
            for (let i in responses) {
              if (responses[i].error) { someFailed = true; }
            }
            if (someFailed) { reject(responses); }
            else { resolve(responses); }
          }
        },
        function (err) { reject(err); }
      );
    });
  }

  end() {
    //const log = this.log;
    this._producer.end();
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = Producer;
