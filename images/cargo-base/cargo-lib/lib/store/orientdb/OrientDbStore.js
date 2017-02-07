'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');

const Promise = require("bluebird");
const _ = require('lodash');
const log4js = require('log4js');
const orientjs = require('orientjs');
const ftpromise = require('retrying-promise');

const StoreBase = require('../StoreBase');

const DATABASE_TYPE = 'graph';
const DATABASE_STORAGE = 'plocal';

const log = log4js.getLogger(`OrientDbStore`);

class OrientDbStore extends StoreBase {

  /**
   * @inheritdoc
   */
  constructor (type) {
    super(type);

    /**
     * @property {orientjs.Server} The OrientDB server object when it is becomes available.
     */
    this._server = null;    // set in init()

    /**
     * @property {orientjs.Db} The OrientDB database object when it is becomes available.
     */
    this._db = null;        // set in _initDatabase()

    this._className = null; // set in init()

    this._dbClass = null;   // set in init()
  }

  // -----------------------------------------------------------------------------------------------
  // Accessors:

  /**
   * @returns {String} The name of the OrientDB class under which the records are stored.
   */
  get className() { return this._className; }

  // -----------------------------------------------------------------------------------------------

  /**
   * @typedef {Object} StoreOpts
   * @property {String} class - The class name.
   * @property {Object} database - The database name.
   * @property {Object} server - The OrientDB server config.
   * @property {String} server.apiPort - The port of the OrientDB server API.
   * @property {String} server.host - The name of the host of the OrientDB server.
   * @property {String} server.password - The password to access the OrientDB server.
   * @property {String} server.user - The user name to access the OrientDB server.
   */

  /**
   * Check the validity of the init options object to be passed to the init() method.
   */
  checkInitOptions(opts) {
    assert(_.isObject(opts), '`opts` should be an object');
    assert(_.isString(opts.class), '`opts.class` should be a string');
    assert(_.isString(opts.database), '`opts.database` should be a string');
    assert(_.isObject(opts.server), '`opts.server` should be an object');
    assert(_.isNumber(opts.server.apiPort), '`opts.server.apiPort` should be a number');
    assert(_.isString(opts.server.host), '`opts.server.host` should be a string');
    assert(_.isString(opts.server.password), '`opts.server.password` should be a string');
    assert(_.isString(opts.server.user), '`opts.server.user` should be a string');
  }

  /**
   * @param {StoreOpts} opts - The options.
   * @returns {Promise}
   */
  init(opts) {
    this._className = opts.class;
    this._dbName = opts.database;
    const { apiPort, host, password, user } = opts.server;
    this.url = `${host}:${apiPort}`;

    // initialize the server proxy:
    const serverOpts = {
      host: host,
      //port: apiPort,
      user: user,
      password: password
    };
    this._server = new orientjs.Server(serverOpts);

    // configure the logger:
    this._server.configureLogger({
      error: log.error.bind(console),
      log: log.trace.bind(console),
      debug: function (msg) {
        //log.debug('DB.debug: ' + msg);
      }
    });

    return this._initDatabase(this._dbName, user, password)
      .then(() => this._getOrCreateClass(this._className))
      .then((dbClass) => {
        this._dbClass = dbClass;
        //log.debug('this._dbClass:', this._dbClass);)
        return true;
      });
  }

  /**
   * Returns a promise that initializes the database.
   *
   * @param {String} dbName - The name of the database.
   * @param {String} user - The user name to access the OrientDB server.
   * @param {String} password - The password to access the OrientDB server.
   * @returns {Promise}
   */
  _initDatabase(dbName, user, password) {
    const retryOpts = {
      factor: 1,
      minTimeout: 2000
    };
    return ftpromise(retryOpts, (resolve, retry, reject) => {
      log.trace(`Initializing database '${dbName}'.`);

      // use or create the database:
      this._server.exists(dbName, DATABASE_STORAGE)
        .then((exists) => {
          if (exists) {
            log.info(`Using database '${dbName}'.`);
            this._db = this._server.use({
              name: dbName
            });
            resolve();
          }
          else {
            //log.trace(`Adding database '${dbName}'.`);
            const dbOpts = {
              name: dbName,
              type: DATABASE_TYPE,
              storage: DATABASE_STORAGE,
              user: user,
              password: password
            };
            return this._server.create(dbOpts)
              .then((db) => {
                log.info(`Created database '${dbName}'.`);
                this._db = db;
                resolve();
              })
              .catch((error) => reject(`Failed to create a database for ${this.url}. ${error}`));
          }
        })
        .catch((error) => {
          if (error instanceof orientjs.errors.ConnectionError) {
            if (error.code == 'ECONNREFUSED') {
              retry(`The connection with the OrientDB server was refused.
                     Is the OrientDB container up and running?`);
            }
            else if (error.code == 'ENOTFOUND') {
              retry(`The OrientDB server could not be found at ${this.url}.
                     Is the OrientDB container up and running?`);
            }
            else {
              reject(this.logError(`Unexpected ConnectionError when initializing the server at ${this.url}.`,
                error));
            }
          }
          else if (error instanceof orientjs.errors.RequestError) {
            reject(this.logError(`Unexpected RequestError when initializing the server at ${this.url}.`,
              error));
          }
          else {
            reject(this.logError(`Unexpected error when initializing the server at ${this.url}.`, error));
          }
        });
    });
  }

  /**
   * Returns a promise that gets the existing class with the given name or creates a new class when it
   * does not yet exist, and passes the resulting db-class object on to the `then` handler.
   *
   * @param {string} className - The name of the class.
   * @returns {Promise}
   */
  _getOrCreateClass(className) {
    //log.debug(`>> App.getOrCreateClass()`);
    return this._db.class.get(className)
      .catch(() => {
        // The DB does not contain the given class, so add it:
        return this._db.class.create(className);
      })
      .then((dbClass) => {
        log.trace(`Created db class '${className}'.`);
        return dbClass;
      })
      .catch((error) => this.logError(`Failed to create the OrientDB class.`, error));
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * @inheritdoc
   */
  stop() {
    try { this._db.close(); } catch (err) {}
    try { this._server.close(); } catch (err) {}
    return Promise.resolve();
  }

  /**
   * @inheritdoc
   */
  drop() {
    if (this._db && this._dbClass) {
      return this._db.class.drop(this._className)
        .then(() => {
          this._dbClass = null;
          log.trace(`Dropped class '${this._className}' from OrientDbStore database '${this._dbName}'.`)
        })
        .catch((error) => this.logError('Failed to drop the class.', error));
    }
    else {
      return Promise.resolve();
    }
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Update & query methods:

  /**
   * Returns a promise that inserts the given (json) object as a new document in the current
   * OrientDB class and resolves to the resulting record object.
   *
   * @param {Object} doc - The data object.
   * @returns {Promise}
   */
  insertDoc(doc) {
    //log.trace('Inserting data in DB...');
    if (!this._dbClass) {
      return Promise.reject(new Error('The database class is not available.'));
    }
    return this._dbClass.create(doc)
      .catch((error) => this.logError('Failed to create a record.', error));
  }

  /**
   *
   */
  updateDoc(rid, doc) {
    return this._db.update(rid).set(doc).one()
      .catch((error) => this.logError('Failed to update a record.', error));
  }

  /**
   * Returns a promise that lists and resolves to all records in the current OrientDB class.
   *
   * @returns {Promise}
   */
  list() {
    if (this._dbClass) {
      return this._dbClass.list()
        .catch((error) => this.logError('Failed to list class.', error));
    }
    else {
      return Promise.resolve([]);
    }
  }

  /**
   * Returns a promise that executes the given query on the default data class (table).
   *
   * Examples:
   * - store.query('SELECT COUNT(*) FROM ${dbClass}');
   * - store.query(`SELECT COUNT(*) FROM ${dbClass} WHERE timestamp > '${startDate.toISOString()}'`);
   *
   * @param {String} sql - The query string.
   * @returns {Promise.<T>}
   */
  query(sql) {
    //console.log('query:', sql);
    return this._db.query(sql);
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Helper methods:

  logError(msg, error) {
    log.error(msg);
    log.error('- err.name', error.name);
    log.error('- err.code', error.code);
    log.error('- err.message', error.message);
    log.error('- err.data', error.data);
    if (!_.isError(error)) { error = new Error(error); }
    error.message = `${msg} ${error.message} Consult the log for more details.`;
    return error;
  }

}

module.exports = OrientDbStore;
