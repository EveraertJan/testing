'use strict';

/**
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const cargo = require('cargo-lib');
const _ = require('lodash');
const log4js = require('log4js');
const Promise = require('bluebird');

const log = log4js.getLogger('App');

class App extends cargo.CargoApp {

  constructor(opts) {
    super(opts);
    this.store = null;
    this.curUsers = [];

    this.logChannel = this.config.get('channels.answers.outgoing');
  }

  /** @inheritdoc */
  *onStart() {
    this.answersTable = this.config.get('store.answers.table');

    const storeOpts = Object.assign({}, this.config.get('store.base'), this.config.get('store.users'));
    this.store = yield cargo.storeManager.initStore(storeOpts.type, storeOpts);
    log.info(`store initialised on use admin`);
    this.serveApi((router) => this.initAPI(router));

  }

  /**
   * @typedef {Object} Container
   * @property {string} id
   * @property {string} type - One of TODO
   * @property {number} value
   * @property {boolean} [enabled = true]
   * @property {string} [excerpt]
   * @property {string} [img] - TODO
   * @property {string} [label]
   */

  /**
   * Initialize the API.
   */
  initAPI(router) {
    const logsTable = this.logsTable;
    const answersTable = this.answersTable;
    const store = this.store;

     const _this = this;
    const devMode = this.config.devMode;

    router
      .get('/answers/test', function* () {
        this.body = {
          test: 'success'
        };
      })
      .get('/answers/', function* () {
        //get answers
        //save answerlist in the state
        //give next id to answe anything
        const result = yield _this.getAnswerList();
        this.body = result;
      })
      .post('/answers/', function* () {
        //get answers
        //save answerlist in the state
        //give next id to answe anything
        const report = this.request.body; 
        const published = yield Promise.all([
          _this.publishEvents(report)
        ]);
        const result = yield _this.addAnswer(this.request.body);
        this.body = result;
      }) 
      .get('/answers/:idx', function* () {
        //get answers
        //save answerlist in the state
        //give next id to answe anything
        const idx = this.params.idx;
        if(idx === null) {
          _this.log.error('no idx defined', this.params);
        } 
        const result = yield _this.getAnswer(idx);
        this.body = result;
      })
      .delete('/answers/:idx', function* () {
        //get answers
        //save answerlist in the state
        //give next id to answe anything
        const idx = this.params.idx;
        if(idx === null) {
          _this.log.error('no idx defined', this.params.idx);
        } 
        const result = yield _this.deleteAnswer(this.params.idx);
        this.body = result;
      })
  }
  publishEvents(report) {
    //this.log.trace('>> App.publishEvents()', report);
    return this.broker.publish(this.logChannel, report)
      .catch((error) => prependError(error, `Failed to publish the log events on the stream broker`));
  }

  addAnswer(payload) {
    if(typeof payload.questionid === "undefined") {
      log.error("no questionId");
      return {};
    }
    if(typeof payload.answer === "undefined") {
      log.error("no answer");
      return {};
    }
    if(typeof payload.userid === "undefined") {
      log.error("no userId");
      return {};
    }
    payload['date_add'] = new Date().getTime();
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.insertDoc(this.answersTable, payload)
      .then((res) => {
        //this.rewardEngine.addReward(`rwd.${label}`, payload);
        if (this.config.devMode) {
          log.trace(`answer added`);
        }
        return res
      })
      .catch((error) => {
        log.error(`Failed to store the user:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  getAnswerList() {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.list(this.answersTable)
      .then((res) => {
        _this.log.trace('list retrieved');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the answer:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  getAnswer(idx) {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.detailDoc(this.answersTable, idx)
      .then((res) => {
        _this.log.trace('detail retrieved');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the answer:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  deleteAnswer(idx) {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.deleteDoc(this.answersTable, idx)
      .then((res) => {
        _this.log.trace('detail deleted');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the answer:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
}


module.exports = App;
