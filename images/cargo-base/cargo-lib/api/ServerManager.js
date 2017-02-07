'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');

const Promise = require('bluebird');
const config = require('cargo-lib/config');
const _ = require('lodash');
const log4js = require('log4js');

const APIServer = require('../api/APIServer');

const log = log4js.getLogger('ServerManager');

class ServerManager {

  constructor(defaultOpts) {
    //log.debug('defaultOpts:', defaultOpts);
    this._servers = new Map();
    this._defaultOpts = Object.assign({}, {
      disableAuth: false,
      jwtSecret: config.get('soyl.auth.jwtSecret'),
      port: 80
    }, defaultOpts);
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Public methods:

  /**
   * @see APIServer#serveApi
   * @param {Object} [opts] - When this object contains a `port` property then the api or content is
   *        served on this port, else the default port 80 is used. The options object is passed to
   *        the server method.
   * @param initializer - @see APIServer#serveApi
   */
  serveApi(opts, initializer) {
    if (_.isFunction(opts)) {
      initializer = opts;
      opts = {};
    }
    this._getServer(opts).serveApi(opts, initializer);
  }

  /**
   * @see APIServer#serveSecureApi
   * @param {Object} [opts] - When this object contains a `port` property then the api or content is
   *        served on this port, else the default port 80 is used. The options object is passed to
   *        the server method.
   * @param initializer - @see APIServer#serveApi
   */
  serveSecureApi(opts, initializer) {
    if (_.isFunction(opts)) {
      initializer = opts;
      opts = {};
    }
    this._getServer(opts).serveSecureApi(opts, initializer);
  }

  /**
   * @see APIServer#serveFolder
   * @param {Object} [opts] - When this object contains a `port` property then the api or content is
   *        served on this port, else the default port 80 is used. The options object is passed to
   *        the server method.
   */
  serveFolder(opts) {
    this._getServer(opts).serveFolder(opts);
  }

  /**
   * @see APIServer#serveReact
   * @param {Object} [opts] - When this object contains a `port` property then the api or content is
   *        served on this port, else the default port 80 is used. The options object is passed to
   *        the server method.
   */
  serveReact(opts) {
    this._getServer(opts).serveReact(opts);
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // System methods:

  startServers() {
    return Promise.each(this._servers.values(), (server) => server.start());
  }

  stopServers() {
    return Promise.each(this._servers.values(), (server) => server.stop());
  }

  /**
   * @param {Object} opts
   * @returns {APIServer}
   * @private
   */
  _getServer(opts) {
    opts = Object.assign({}, this._defaultOpts, opts);
    assert(_.isNumber(opts.port), 'The port option must be a number.');
    let server = this._servers.get(opts.port);
    if (!server) {
      server = new APIServer(opts);
      this._servers.set(opts.port, server);
    }
    return server;
  }

}

module.exports = ServerManager;
