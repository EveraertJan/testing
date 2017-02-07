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
    this.userTable = this.config.get('store.users.table');

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
    const userTable = this.userTable;
    const store = this.store;

     const _this = this;
    const devMode = this.config.devMode;

    router
      .get('/user/test', function* () {
        this.body = {
          test: 'success'
        };
      })
      .post('/user/', function* () {
        //get questions
        //save questionlist in the state
        //give next id to answe anything
        const report = this.request.body; 
        const result = yield _this.addUser(this.request.body);
        this.body = result;
      })  
  }

  addUser(payload) {
    if(typeof payload.username === "undefined") {
      log.error("no username");
      return {};
    }
    if(typeof payload.email === "undefined") {
      log.error("no email");
      return {};
    }
    if(typeof payload.age === "undefined") {
      log.error("no age");
      return {};
    }
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    payload['date_add'] = new Date().getTime();
    //log.debug(payload);
    return this.store.insertDoc(this.userTable, payload)
      .then((res) => {
        //this.rewardEngine.addReward(`rwd.${label}`, payload);
        if (this.config.devMode) {
          log.trace(`user added`);
        }
        return res
      })
      .catch((error) => {
        log.error(`Failed to store the user:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
}


module.exports = App;
