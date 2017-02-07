'use strict';

/**
 * @module cargo-lib/api/APIServer
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');
const EventEmitter = require('events');

const Promise = require('bluebird');
const jwt = require('cargo-lib/api/jwt');
const config = require('cargo-lib/config');
const Cors = require('kcors');
const Koa = require('koa');
const Parser = require('koa-bodyparser');
const mount = require('koa-mount');
const Router = require('koa-router');
const send = require('koa-send');
const _ = require('lodash');
const log4js = require('log4js');
const nodetree = require('nodetree');

const prependError = require('../utils/prependError');

const AuthRouter = require('./AuthRouter');

const log = log4js.getLogger('APIServer');

class APIServer extends EventEmitter {

  /**
   * @param {boolean} disableAuth = false -
   * @param {string} jwtSecret
   * @param {string} service - The name of the service that instantiates this APIServer.
   * @param {number} port
   */
  constructor({ disableAuth = false, jwtSecret, service, port }) {
    super();

    assert(_.isString(jwtSecret), `The jwtSecret parameter should be a string, got ${jwtSecret}.`);
    assert(_.isString(service), `The service parameter should be a string, got ${service}.`);
    assert(_.isNumber(port), `The port parameter should be a number, got ${port}.`);

    this._jwtSecret = jwtSecret;
    this._service = service;
    this._port = port;
    this._name = `${service}:${port}`;
    this._devMode = config.get('devMode');
    this._started = false;
    this._server = null;

    // Disables authorization functionality, which, obviously should be used with the greatest care.
    this._enableAuth = !disableAuth;

    // Array of functions that, when called, return a promise. When the server starts, these
    // functions are called and the resulting promises are awaited.
    this._startTasks = [];

    // Array of functions that, when called, return a promise. When the server stops, these
    // functions are called and the resulting promises are awaited.
    this._stopTasks = [];

    // Initialize the HTTP-server:
    this._rootKoa = this._initRootKoa();
  }

  _initRootKoa() {
    const koa = Koa();
    koa.name = this.name;
    koa.use(Cors()); // Add the CORS-headers:

    // Add x-response-time in response for debugging purposes:
    koa.use(function* (next) {
      //log.trace('>> x-response-time');
      const start = Date.now();
      yield next;
      this.set('X-Response-Time', `${Date.now() - start}ms`);
    });

    // Handle downstream errors:
    koa.use(function *(next) {
      try { yield next; }
      catch (error) {
        //log.error(error);
        this.status = error.status || 500;
        if (this.status === 500) {
          //log.error('Internal server error:', error);
        }
        if (process.env.NODE_ENV !== 'production') {
          log.debug('not production', error.message);
          error.expose = true;
          this.body = error.message;
        }
      }
    });

    // Log requests:
    if (process.env.NODE_ENV === 'development') {
      koa.use(function* (next) {
        log.debug(`${this.method} ${this.url}:`, this.request.body);
        yield next;
      });
    }

    return koa;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Accessors:

  /**
   * @returns {Number} The name of the server.
   */
  get name() { return this._name; }

  /**
   * @returns {Number} The port on which the server is listening.
   */
  get port() { return this._port; }

  /**
   * @returns {Number} The name of the service.
   */
  get service() { return this._service; }

  /**
   * @returns {boolean} True when the server is running.
   */
  get started() { return this._started; }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // start/stop methods:

  /**
   * Returns a promise that starts the koa server.
   * @returns {Promise}
   */
  start() {
    if (this._started) { return Promise.resolve(); }
    log.debug(`Starting APIServer ${this.name} on port ${this._port} .`);
    return new Promise((resolve, reject) => {
      try {
        this._server = this._rootKoa.listen(this._port);
        this._server.on('listening', () => {
          //log.debug('...listening on port', this._port);
          this._started = true;
          Promise.each(this._startTasks, (t) => t()).then(resolve);
        });
      }
      catch (error) {
        log.error('Unexpected error in APIServer.start():', error);
        reject(`Unexpected error in APIServer.start(): ${error}`);
      }
    });
  }

  /**
   * Returns a promise that stops the server when it is active. It resolves when all connections are
   * ended. See https://nodejs.org/dist/latest-v6.x/docs/api/net.html#net_server_close_callback.
   * @returns {Promise}
   */
  stop() {
    const _this = this;
    return Promise.coroutine(function* () {
      if (!_this._started) { return; }
      yield (new Promise((resolve) => {
        _this._server.close(() => {
          resolve();
        });
      }));
      delete _this._server;
      _this._started = false;
      yield Promise.all(_this._stopTasks.map((t) => t()));
    })();
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Serve methods:

  /**
   * @typedef {Object} ApiOptions
   * @property {string} [route = '/'] - The base route on which to server the api.
   */

  /**
   * Adds a nested router in the base router. You are encouraged to serve an api protected with
   * authentication and authorization by using {@link serveSecureApi} instead.
   * @param {ApiOptions} [opts] - The options.
   * @param {function} initializer - A function that takes a {@link Router} (koa-router) instance as
   *        sole argument and adds all routes to this router. Note that when this function returns,
   *        the router will be added as nested router in the base router. This involves the use of
   *        router.routes(), which adds all the routes added in the initializer function. Any route
   *        added after this will thus not be handled by the base router.
   * @see https://github.com/alexmingoia/koa-router
   */
  serveApi(opts, initializer) {
    //log.trace(`>> serveApi(${opts})`);
    let route = '/';
    if (_.isFunction(opts)) {
      initializer = opts;
    }
    else if (_.isObject(opts)) {
      if (_.isString(opts.route)) { route = opts.route; }
    }

    assert(_.isString(route), 'The route should be a string.');
    assert(_.isFunction(initializer), 'The initializer should be a function.');

    // Initialize a new koa instance and a router, and mount the new koa on the given route:
    const subKoa = new Koa();
    subKoa.use(Parser());  // Parse the JSON body:
    const router = new Router();
    initializer(router);
    subKoa.use(router.routes());  // , router.allowedMethods()
    this._rootKoa.use(mount(route, subKoa));
  }

  /**
   * @typedef {Object} SecureApiOptions
   * @property {string} [route = '/'] - The base route on which to server the api.
   * @property {AuthManager} [authManager] To be provided when serving from the soyl-auth service.
   */

  /**
   * Sets up the server to serve a secure REST API that is protected with authentication and
   * activity-based authorization.
   * @param {SecureApiOptions} [opts] - The options.
   * @param {function} initializer - A function that takes a {@link AuthRouter} instance as sole
   *        argument and adds all routes to this router. Note that when this function returns, the
   *        router will be added as nested router in the base router. This involves the use of
   *        `router.routes()`, which adds all the routes added in the initializer function. Any
   *        route added after this will thus not be handled by the router.
   * @returns {Promise}
   * @see AuthRouter
   * @see https://github.com/koajs/jwt
   */
  serveSecureApi(opts, initializer) {
    //log.trace(`>> serveSecureApi(${opts})`);
    let route = '/';
    let authManager;
    if (_.isFunction(opts)) {
      initializer = opts;
    }
    else if (_.isObject(opts)) {
      if (_.isString(opts.route)) {
        route = opts.route;
      }
      authManager = opts.authManager;
    }

    assert(_.isString(route), 'The route should be a string.');
    assert(_.isFunction(initializer), 'The initializer should be a function.');

    // Create a new sub-server:
    const subKoa = new Koa();
    subKoa.use(Parser());  // Parse the JSON body:

    // Add the middleware that asserts the jwt-token:
    if (this._enableAuth) {
      const koaJwtOpts = {
        secret: this._jwtSecret,
        debug: this._devMode
      };
      subKoa.use(jwt.middleware(koaJwtOpts));  // authenticate all subsequent routes
    }

    // Add the secure API router:
    const authRouter = new AuthRouter({ authManager, enableAuth: this._enableAuth });
    initializer(authRouter); // initialize the application API
    subKoa.use(authRouter.routes());

    // Integrate the sub-server in the main server:
    this._rootKoa.use(mount(route, subKoa));

    if (this._enableAuth) {
      // Register the activities when the server is up and running:
      this._startTasks.push(() => authRouter.registerActivities());
    }
  }

  /**
   * @typedef {Object} FolderOptions
   * @property {string} [route = '/'] - The base route on which to server the React content.
   * @property {String} [root = '/cargo/html'] - Path of the directory to serve on the given route.
   */

  /**
   * Serve the static content in the given root on the given route.
   * @param {FolderOptions} [opts]
   */
  serveFolder(opts = {}) {
    //log.trace(`>> serveFolder(${opts})`);
    const { route = '/', root = '/cargo/html' } = opts;
    assert(_.isString(route), 'The route parameter should be a string.');
    assert(_.isString(root), 'The root parameter should be a string.');

    // Initialize a new koa instance, add the file serving middleware, and mount the new koa on the
    // given route:
    const subKoa = new Koa();
    subKoa.use(function* (next) {
      yield send(this, this.path, { root: root });
      if (this.body == null || this.status == 404) {
        yield next;
      }
    });
    this._rootKoa.use(mount(route, subKoa));
  }

  /**
   * @typedef {Object} ReactOptions
   * @property {string} [route = '/'] - The base route on which to server the React content.
   * @property {String} [root = '/cargo/html/dist'] - Path of the root directory of the packed web
   *           content when not in html-watch-mode.
   */

  /**
   * Serves a standard React-based Cargo frontend.
   * @param {ReactOptions} [opts]
   */
  serveReact(opts = {}) {
    //log.trace(`>> serveReact(${opts}`);
    const { route = '/', root = '/cargo/html/dist' } = opts;
    assert(_.isString(route), 'The route option should be a string.');
    assert(_.isString(root), 'The root parameter should be a string.');

    //log.debug('process.env.HTML_WATCH_MODE:', process.env.HTML_WATCH_MODE);
    const watchMode = process.env.HTML_WATCH_MODE === 'true'
      && process.env.NODE_ENV === 'development';
    if (watchMode) {
      const webpackConfig = require('/cargo/html/src/webpack.config.js')('hot', {
        publicPath: route,
        maskedConfig: {
          log: {
            debug: (...args) => log.debug(...args),
            error: (...args) => log.error(...args)
          }
        }
      });
      //log.debug('webpackConfig:', webpackConfig);
      //log.debug('webpackConfig.module:', webpackConfig.module);
      const compiler = require('webpack')(webpackConfig);

      // Create a new Koa to mount on the given route, or use the root Koa when route is '/'.
      const subKoa = (route == '/' ? this._rootKoa : new Koa());

      //const debugMW = function* (next) {
      //  if (this.url === '/__webpack_hmr') {
      //    log.debug(`debugMW - request: ${this.method}: ${this.url}`);
      //    for (const key in this.request.headers) {
      //      log.debug(` - ${key}: ${this.request.headers[key]}`);
      //    }
      //    yield* next;
      //    log.debug(`debugMW > response:`);
      //    log.debug(` - status:`, this.status);
      //    log.debug(` - headers:`);
      //    for (const key in this.response.headers) {
      //      log.debug(`   - ${key}: ${this.response.headers[key]}`);
      //    }
      //  }
      //  else {
      //    yield* next;
      //  }
      //};
      //subKoa.use(debugMW);

      // Use Webpack dev-server middleware:
      const devMWOpts = {
        noInfo: false,    // display no info to console (only warnings and errors)
        quiet: false,     // display nothing to the console
        lazy: false,      // Lazy = no watching; recompilation on every request
        publicPath: webpackConfig.output.publicPath,          // public path to bind the middleware to
        headers: { "X-Custom-Header": "yes" },                // custom headers
        stats: {          // options for formatting the statistics
          //assets: false,
          chunks: false,
          colors: true,
          //hash: false,
          reasons: true
          //version: false
        }
      };
      if (process.env.POLLING_WATCH === 'true') {
        // Enable polling watch options (when lazy is false):
        devMWOpts.watchOptions = { aggregateTimeout: 300, poll: 1000 }
      }
      const devMW = require("koa-webpack-dev-middleware")(compiler, devMWOpts);
      subKoa.use(devMW);

      // Use Webpack hot-reloading middleware:
      // TODO: Disabled due to issue
      //const hotMW = require("koa-webpack-hot-middleware")(compiler, {
      //  log: (...args) => log.debug('hotMW log:', ...args)
      //});
      //subKoa.use(hotMW);

      // Returns index.html to all calls that could not be handled by the hot & dev middlewares.
      subKoa.use(function* () {
        //log.debug('indexMW - req.url:', this.req.url);
        if (this.body == null || this.status == 404) {
          // There is no static content for routes defined in react-router. Therefore, all routes for
          // which there is no static content are rerouted to index.html, which handles the routes
          // defined with react-router.
          yield send(this, 'index.html', { root: '/cargo/html/src' });
        }
      });

      if (subKoa != this._rootKoa) { this._rootKoa.use(mount(route, subKoa)); }

      this._stopTasks.push(() => Promise.promisify(devMW.close));
      log.info(`Serving front-end at '${route}' with Webpack Hot Reload middleware.`);
    }
    else {
      assert(_.isString(root), 'The root option should be a string.');
      //nodetree(root, { all: true, level: 2 });

      // Create a new Koa to mount on the given route, or use the root Koa when route is '/'.
      const subKoa = (route == '/' ? this._rootKoa : new Koa());

      subKoa.use(function* () {
        yield send(this, this.path, { root });
        if (this.body == null || this.status == 404) {
          // There is no static content for routes defined in react-router. Therefore, all routes
          // for which there is no static content are rerouted to index.html, which handles the
          // routes defined with react-router.
          yield send(this, 'index.html', { root });
        }
      });

      if (subKoa != this._rootKoa) { this._rootKoa.use(mount(route, subKoa)); }

      log.info(`Serving React content from '${root}' at '${route}' statically.`);
    }
  }

}

module.exports = APIServer;
