'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const axios = require('axios');
const cargo = require('cargo-lib');
const request = require('cargo-lib/api/request');
const CargoApp = require('cargo-lib/CargoApp');
const prependError = require('cargo-lib/utils/prependError');
const _ = require('lodash');
const log4js = require('log4js');

const log = log4js.getLogger('App');

class App extends CargoApp {

  constructor(opts) {
    super(opts);

    // The channels for which to store the message:
    this.logChannels = [
      this.config.get('channels.logs.incoming'),
      this.config.get('channels.rulesEngine.matches'),
      this.config.get('channels.system.asmResponses')
    ];

    this.store = null;
  }

  /** @inheritdoc */
  *onStart() {
    // Initialize the data store:
    const storeOpts = Object.assign({}, this.config.get('store.base'), this.config.get('store.logs'));
    this.store = yield cargo.storeManager.initStore(storeOpts.type, storeOpts);
    log.info(`Initialized the data store`);

    // Subscribe to channels:
    this.broker.subscribe(this.logChannels, (channel, message) => {
      let payload = {};
      if(message.type == "rulesEngine.match") {
        // @todo: add accurate message later
        const t = new Date().getTime();
        payload = {
          channel: channel,
          event_id: 1,
          report_id: 1,
          platform: 'match',
          client: 'rules-engine',
          user_id: message.user,
          timestamp: t,
          type: message.type,
          data: JSON.stringify(message)
        }
      }
      else {
        payload = {
          channel: channel,
          type: message.type,
          event_id: message.eventId,
          report_id: message.reportId,
          platform: message.platform,
          client: message.client,
          user_id: message.user,
          timestamp: message.timestamp,
          data: JSON.stringify(message)
        }
      }
      this.store.insertDoc(this.config.get('store.logs.table'), payload )
        .then(record => {
          if (this.config.devMode) {
            //log.trace(`archived msg from '#${channel}' as record: ${JSON.stringify(record)}`);
          }
        })
        .catch((error) => {
          log.error(`Failed to archive a message.`);
          log.error(`- message:`, message);
          log.error(`- channel:`, channel);
          log.error(`- error:`, error);
        });
    });
  }

  /** @inheritdoc */
  *onStop() {
    yield this.store.stop();
  }

}

module.exports = App;
