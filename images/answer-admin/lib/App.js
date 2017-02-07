'use strict';

/**
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const cargo = require('cargo-lib');
const _ = require('lodash');
const log4js = require('log4js');


const log = log4js.getLogger('App');

class App extends cargo.CargoApp {

  constructor(opts) {
    super(opts);
    this.store = null;
  }

  /** @inheritdoc */
  *onStart() {
    this.answersTable = this.config.get('store.answers.table');
    const storeOpts = Object.assign({}, this.config.get('store.base'), this.config.get('store.answers'));
    this.store = yield cargo.storeManager.initStore(storeOpts.type, storeOpts);
    log.info(`store initialised on reward admin`);
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
    const userTable = this.userTable;
    const store = this.store;

     const _this = this;
    const devMode = this.config.devMode;

    router
      .get('/answer/', function* () {
        this.body = {
          test: 'success'
        };
      })
      .post('/answer/',  function* () {
        _this.log.debug(this.params);
        _this.log.debug(this);

        const report = this.request.body; 
        _this.log.debug(report);

        const result = yield _this.addAnswer(this.request.body);
        this.body = result;
      }) 
  }

  addAnswer(payload) {
    const _this = this;
    if(typeof payload.questionid === "undefined") {
      log.error("no questionid");
      return {};
    }
    if(typeof payload.answer === "undefined") {
      log.error("no answer");
      return {};
    }
    if(typeof payload.userid === "undefined") {
      log.error("no userid");
      return {};
    }
    this.log.debug(payload);
    return this.store.insertDoc(this.answersTable, payload)
      .then((res) => {
        //this.rewardEngine.addReward(`rwd.${label}`, payload);
        if (this.config.devMode) {
          log.trace(`answer added`);
        }
        return res
      })
      .catch((error) => {
        log.error(`Failed to store the answer:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }


}


module.exports = App;
