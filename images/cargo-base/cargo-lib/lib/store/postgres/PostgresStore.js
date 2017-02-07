'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require("bluebird");
const jsonSql = require("json-sql")({ separatedValues: false, dialect: 'postgresql' });
const _ = require('lodash');
const log4js = require('log4js');
const pg = require('pg');
//const ftpromise = require('retrying-promise');

const StoreBase = require('../StoreBase.js');

const log = log4js.getLogger('PostgresStore');

class PostgresStore extends StoreBase {

  /**
   * @inheritdoc
   */
  constructor (type) {
    super(type);

    /**
     * @property {pg.Server} The postgres server object when it is becomes available.
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
   * @param {StoreOpts} opts - The options.
   * @returns {Promise}
   */
  init(opts) {
    const { apiPort, database, host, pass, user, webPort } = opts;
    this.url = `${host}:${apiPort}`;

    const config = {
      host: host,
      user: user,
      database: database,
      password: pass,
      port: `${webPort}`,
      max: 10, // max number of clients in the pool 
      idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
    };

    this._server = new pg.Pool(config);
    return this._server.connect();
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

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Update & query methods:

  clearTable(table) {
    try {
      return new Promise((resolve, reject) => {
        this._server.connect(function (err, client, done) {
          const query = `TRUNCATE ${table}`;
          log.trace(query);
          client.query(query, function (err, result) {
            done();
            err ? reject(err) : resolve(result.rows);
          });
        })
      });
    }
    catch (err) {
      log.error('unable to clear the docs', err);
    }
  }

  /**
   * Returns a promise that inserts the given (json) object as a new document in the current
   * OrientDB class and resolves to the resulting record object.
   *
   * @param {Object} doc - The data object.
   * @returns {Promise}
   */
  insertDoc(table, doc) {
    //log.trace(doc);
    return new Promise((resolve, reject) => {
      return this._server.connect((err, client, done) => {
        const query = jsonSql.build({
          type: 'insert',
          table,
          values: doc
        }).query;
        log.trace(query);
        client.query(query, function (err, result) {
          done();
          err ? reject(err) : resolve(result.rows);
        });
      })
    })
      .catch((err) => {
        log.error('unable to insert doc', err);
      });
  }

  deleteDoc(table, doc) {
    const app = this;
    //log.trace('message from store', doc);
    try {
      return new Promise((resolve, reject) => {
         this._server.connect(function (err, client, done) {
          const query = jsonSql.build({
            type: 'remove',
            table,
            condition: {
              id: doc.id
            }
          }).query;
          //app.log.trace(query);
          client.query(query, function (err, result) {
            done();
            err ? reject(err) : resolve(result.rows);
          });
        })
      })
    }
    catch (err) {
      log.error('unable to delete doc', err);
    }
  }

  /**
   * Returns a promise that lists and resolves to all records in the current OrientDB class.
   *
   * @returns {Promise}
   */
  list(table, user = null) {
    try {
      return new Promise((resolve, reject) => {
        this._server.connect(function (err, client, done) {
          if(user) {
            client.query(`SELECT * FROM ${table} WHERE user_id='${user}'`, function (err, result) {
              done();
              err ? reject(err) : resolve(result.rows);
            });
          } else {
            client.query(`SELECT * FROM ${table}`, function (err, result) {
              done();
              err ? reject(err) : resolve(result.rows);
            });
          }
        })
      });
    }
    catch (err) {

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
    try {
      return new Promise((resolve, reject) => {
        this._server.connect(function (err, client, done) {
          client.query(sql, function (err, result) {
            done();
            err ? reject(err) : resolve(result.rows);
          });
        })
      });
    } catch (err) {

    }
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

module.exports = PostgresStore;
