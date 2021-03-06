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
    this.curUsers = [];
  }

  /** @inheritdoc */
  *onStart() {
    this.usersTable = this.config.get('store.users.table');

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
    const usersTable = this.usersTable;
    const store = this.store;

     const _this = this;
    const devMode = this.config.devMode;

    router
      .get('/users/test', function* () {
        this.body = {
          test: 'success'
        };
      })
      .get('/users/', function* () {
        //get users
        //save userlist in the state
        //give next id to answe anything
        const result = yield _this.getUserList();
        this.body = result;
      })
      .post('/users/', function* () {
        //get users
        //save userlist in the state
        //give next id to answe anything
        const report = this.request.body; 
        const result = yield _this.addUser(this.request.body);
        this.body = result;
      }) 
      .get('/users/:idx', function* () {
        //get users
        //save userlist in the state
        //give next id to answe anything
        const idx = this.params.idx;
        if(idx === null) {
          _this.log.error('no idx defined', this.params);
        } 
        const result = yield _this.getUser(idx);
        this.body = result;
      })
      .delete('/users/:idx', function* () {
        //get users
        //save userlist in the state
        //give next id to answe anything
        const idx = this.params.idx;
        if(idx === null) {
          _this.log.error('no idx defined', this.params.idx);
        } 
        const result = yield _this.deleteUser(this.params.idx);
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
    if(typeof payload.gender === "undefined") {
      log.error("no gender");
      return {};
    }
    const _this = this;
    payload['date_add'] = new Date().getTime();
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.insertDoc(this.usersTable, payload)
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
  getUserList() {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.list(this.usersTable)
      .then((res) => {
        _this.log.trace('list retrieved');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the user:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  getUser(idx) {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.detailDoc(this.usersTable, idx)
      .then((res) => {
        _this.log.trace('detail retrieved');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the user:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  deleteUser(idx) {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.deleteDoc(this.usersTable, idx)
      .then((res) => {
        _this.log.trace('detail deleted');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the user:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
}


module.exports = App;
