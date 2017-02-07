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
    this.questionsTable = this.config.get('store.questions.table');

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
    const questionsTable = this.questionsTable;
    const store = this.store;

     const _this = this;
    const devMode = this.config.devMode;

    router
      .get('/questions/test', function* () {
        this.body = {
          test: 'success'
        };
      })
      .get('/questions/', function* () {
        //get questions
        //save questionlist in the state
        //give next id to answe anything
        const result = yield _this.getQuestionList();
        //result.sort(_this.dynamicSort('thema'));
        const resp = _this.cherryPick(_this.shuffleArray(result));
        resp.sort(_this.dynamicSort('thema'));
        // send number of questions to the frontend, from each series one
        // implement filter here
        this.body = resp;
      })
      .post('/questions/', function* () {
        //get questions
        //save questionlist in the state
        //give next id to answe anything
        const report = this.request.body; 
        const result = yield _this.addQuestion(this.request.body);
        this.body = result;
      }) 
      .get('/questions/:idx', function* () {
        //get questions
        //save questionlist in the state
        //give next id to answe anything
        const idx = this.params.idx;
        if(idx === null) {
          _this.log.error('no idx defined', this.params);
        } 
        const result = yield _this.getQuestion(idx);
        this.body = result;
      })
      .delete('/questions/:idx', function* () {
        //get questions
        //save questionlist in the state
        //give next id to answe anything
        const idx = this.params.idx;
        if(idx === null) {
          _this.log.error('no idx defined', this.params.idx);
        } 
        const result = yield _this.deleteQuestion(this.params.idx);
        this.body = result;
      })
  }
  cherryPick(results) {
    const catised = {};
    for( const item in results) {
      catised[results[item].thema] = results[item];
    }
    return catised;
  }

  dynamicSort(property) {
    let sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return (a,b) => {
        let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
  }
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
  }
  addQuestion(payload) {
    if(typeof payload.label === "undefined") {
      log.error("no label");
      return {};
    }
    if(typeof payload.type === "undefined") {
      log.error("no type");
      return {};
    }
    if(typeof payload.question === "undefined") {
      log.error("no question");
      return {};
    }
    if(typeof payload.explanation === "undefined") {
      log.error("no explanation");
      return {};
    }
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.insertDoc(this.questionsTable, payload)
      .then((res) => {
        //this.rewardEngine.addReward(`rwd.${label}`, payload);
        if (this.config.devMode) {
          log.trace(`question added`);
        }
        return res
      })
      .catch((error) => {
        log.error(`Failed to store the user:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  getQuestionList() {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.list(this.questionsTable)
      .then((res) => {
        _this.log.trace('list retrieved');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the question:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  getQuestion(idx) {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.detailDoc(this.questionsTable, idx)
      .then((res) => {
        _this.log.trace('detail retrieved');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the question:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
  deleteQuestion(idx) {
    const _this = this;
    // TODO: first assert that there isn't already a reward with the given id...
    //log.debug(payload);
    return this.store.deleteDoc(this.questionsTable, idx)
      .then((res) => {
        _this.log.trace('detail deleted');
        return res
      })
      .catch((error) => {
        log.error(`Failed to get the question:`);
        log.error(`- message:`, error.message);
        log.error(`- error:`, error);
      });
  }
}


module.exports = App;
