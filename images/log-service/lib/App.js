'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const cargo = require('cargo-lib');
const CargoApp = require('cargo-lib/CargoApp');
const trimMsg = require('cargo-lib/utils/trimMsg');
const uuid = require('cargo-lib/utils/uuid');
const _ = require("lodash");
const log4js = require('log4js');
const Promise = require('bluebird');
const prependError = require('cargo-lib/utils/prependError');
const log = log4js.getLogger('App');

const DelayedPromiseQueue = require('./DelayedPromiseQueue.js');
const MatchHandler = require('./MatchHandler.js');

const MAX_RESPONSE_DELAY = 3000;

class App extends CargoApp {

  constructor(opts) {
    super(opts);

    this.defaultPlatform = 'dev';

    // @property {String[]} The broker channels from which facts should be sourced.
    this.logChannel = this.config.get('channels.logs.incoming');

    this.requestQueue = new DelayedPromiseQueue(MAX_RESPONSE_DELAY, this.log);
    this.MatchHandler = new MatchHandler(this);
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // onStart handler:

  /** @inheritdoc */
  *onStart() {
    const matchChannel = this.config.get('channels.answers.incomming');
    this.serveApi((router) => this.initAPI(router));
    const _this = this;
    yield this.broker.subscribe([matchChannel, 'fogg.logService.transfer'], (channel, message) => {
      if(channel === ' fogg.answers.incomming' || message.fact) {
        this.requestQueue.matched(message.fact.reportId, message);
        //this.log.debug('delayQue');
      } else {
        _this.validateReport(message);
        _this.normalizeReport(message);
        _this.requestQueue.add(message.reportId, message)
        _this.publishEvents(message)
        
      }
    });

  }

  initAPI(router) {
    const _this = this;
    const devMode = this.config.devMode;
    const store = this.store;

    router
      .get('/logs/test', function* () {
        this.body = {
          test: 'success'
        };
      })
      .post('/logs/', function* () {
        const report = this.request.body; 
        // Yield a promise which resolves to `next` when the submitted log report is processed.
        _this.validateReport(report);
        _this.normalizeReport(report);

        // The promise returned by requestQueue.add resolves when the request expires or is retracted:
        const results = yield Promise.all([
          _this.requestQueue.add(report.reportId, report),
          _this.publishEvents(report)
        ]);

        //this.body = yield _this.buildResponseBody(results[0]); // triggers error -- fix this
        this.status = 202;
      })
      .post('/logs/report.json', function* () {
        const report = this.request.body;
        //this.log.debug('report',report);

        // Yield a promise which resolves to `next` when the submitted log report is processed.
        _this.validateReport(report);
        _this.normalizeReport(report);

        // The promise returned by requestQueue.add resolves when the request expires or is retracted:
        const results = yield Promise.all([
          _this.requestQueue.add(report.reportId, report),
          _this.publishEvents(report)
        ]);

        //this.body = yield _this.buildResponseBody(results[0]); // triggers error -- fix this
        this.status = 202;
      });
  }

  /**
   * Validates the report. Throw an error when validation failes.
   * @param {Object} report - The submitted log report (the request body).
   */
  validateReport(report) {
    //this.log.trace('>> App.validateReport');
    const baseMsg = 'The log report validation failed. ';
    this.log.debug('report', report);

    if (_.isArray(report) || !_.isObject(report)) {
      throw new Error(`${baseMsg} The log report is not an object.`);
    }

    if (_.isUndefined(report.client)) {
      throw new Error(`${baseMsg} Missing 'clientId' property in log report object.`);
    }
    else if (!_.isString(report.client)) {
      throw new Error(`${baseMsg} The 'client' property in the log report object should be a string.`);
    }

    //if (_.isUndefined(report.user)) {
    //  throw new Error(`${baseMsg} Missing 'user' property in log report object.`);
    //}
    //else if (!_.isString(report.user)) {
    //  throw new Error(`${baseMsg} The 'user' property in the log report object should be a string.`);
    //}

    if (_.isUndefined(report.events)) {
      throw new Error(`${baseMsg} Missing 'events' property in log report object.`);
    }
    else if (!_.isArray(report.events)) {
      throw new Error(`${baseMsg} The 'events' property in the log report object should be an array.`);
    }
    for (let event of report.events) {
      if (_.isUndefined(event.timestamp)) {
        throw new Error(`${baseMsg} Some event objects have no timestamp.`);
      }
    }
  }

  /**
   * @param {Object} report - The submitted log report (the request body).
   * @returns {Promise} A promise that normalizes the given report and resolves to the normalized
   *            report, or rejects when the normalization failed.
   */
  normalizeReport(report) {
    //this.log.trace('>> App.normalizeReport');
    try {
      // sort the event according to their timestamp:
      for (let event of report.events) {
        event.__date__ = new Date(event.timestamp);
      }
      report.events.sort((a, b) => a.__date__ - b.__date__);

      // Add missing properties:
      if (_.isUndefined(report.platform)) {
        report.platform = this.defaultPlatform;
      }
      if (_.isUndefined(report.user)) {
        report.user = 'dev.x';
      }
      report.reportId = uuid();  // Add id to the report object:
      for (let event of report.events) {
        delete event.__date__;
        event.eventId = uuid();  // Add id to event object:
        event.reportId = report.reportId;
        event.platform = report.platform;
        event.client = report.client;
        event.socketId = report.socketId;
        if(_.isUndefined(event.user)) {
          event.user = report.user;
        }
      }
    }
    catch (error) {
      error.message = `Failed to normalize the report. ${error.message}`;
      throw error;
    }
  }

  /**
   * @param {Object} report - The submitted log report (the request body).
   * @returns {Promise} A promise that publishes the log event on the stream broker.
   */
  publishEvents(report) {
    //this.log.trace('>> App.publishEvents()', report);
    return this.broker.publish(this.logChannel, report.events)
      .catch((error) => prependError(error, `Failed to publish the log events on the stream broker`));
  }

  /**
   * @param {Object} entry - The queue entry.
   * @returns {Promise} A promise that constructs and resolved to the response body.
   */
  buildResponseBody(entry) {
    //this.log.debug('>> App.buildResponseBody()');
    //this.log.debug('entry', entry);

    // The base response object:
    const response = { success: true };  // base response

    // Handle rules engine matches:
    if (entry.matched) {
      return this.MatchHandler.handle(entry.reason, response);
    }
    else {
      return response;
    }
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = App;
