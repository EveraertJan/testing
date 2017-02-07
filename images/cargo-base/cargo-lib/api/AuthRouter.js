'use strict';

/**
 * @module cargo-lib/AuthRouter
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');

const axios = require('axios');
//const bigInt = require("big-integer");
const Promise = require('bluebird');
const config = require('cargo-lib/config');
const BigBitmap = require('cargo-lib/utils/BigBitmap');
const ServerError = require('cargo-lib/utils/ServerError');
const KoaRouter = require('koa-router');
const _ = require('lodash');
const log4js = require('log4js');
const retryPromise = require('retrying-promise');

// -------------------------------------------------------------------------------------------------

const log = log4js.getLogger('AuthRouter');

// -------------------------------------------------------------------------------------------------

/**
 * An AuthRouter object behaves like the koa-router object it wraps. It provides the methods
 * `get()`, `post()`, `put()`, `delete()` (and the alias `del()`), `patch()`, `head()`, and
 * `options()`, which all take three arguments:
 *
 *  - path - The path (route) string.
 *  - activity - A string that identifies the activity the user must be authorized to perform in
 *               order to be able to use this route.
 *  - middleware - The Koa middleware (a generator function) that is to be called when the user is
 *                 authorized.
 *
 * These methods simply call the corresponding method in the wrapped `koa-router` object, passing
 * the given path and two middleware functions: an authorizing middleware and the given middleware.
 * The authorizing middleware authorizes the user set in `ctx.state.user` by the middleware in
 * `cargo-lib/api/jwt`. When authorized, it yields to the given middleware, else it sets the 403
 * error status and returns.
 *
 * @see https://github.com/alexmingoia/koa-router
 * @see https://github.com/koajs/jwt
 */
 class AuthRouter {

  /**
   * @param {Object} [opts] - Options for the wrapped `koa-router` instance.
   * @property {AuthManager} [opts.authManager] - The AuthManager singleton when serving a secure
   *           API from the Auth service itself
   * @property {Object} koaRouterOpts - The options object for the underlying KoaRouter instance.
   * @see https://github.com/alexmingoia/koa-router
   */
  constructor(opts = {}) {
    const { authManager, enableAuth, koaRouterOpts } = opts;
    this.authManager = authManager;
    this.enableAuth = enableAuth;
    this.authHost = config.get('soyl.auth.host');
    this.koaRouter = new KoaRouter(koaRouterOpts); // The wrapped koa-router
    this._toRegister = new Set(); // The set of activities that needs to be registered
    const _this = this;

    // Add get/post/delete/... methods:
    this.koaRouter.methods.forEach((method) => {
      method = method.toLowerCase();
      this[method] = function (route, authSpec, middleware) {
        assert(_.isString(route) || _.isRegExp(route),
          `The route must a string or RegExp, instead got ${route}.`);

        // The authSpec parameter is optional.
        if (!middleware) {
          middleware = authSpec;
          authSpec = null;
        }

        // No authorization is required when the authSpec is not provided.
        if (enableAuth && authSpec) {
          if (_.isString(authSpec)) {
            _this._toRegister.add(authSpec);
          }

          // The authorizing middleware, which throws a ServerError when not authorized, or yields
          // to the next middleware:
          const authMiddleware = function* (next) {
            assert(_.isObject(this.state), 'this.state is missing');
            assert(_.isObject(this.state.user), 'this.state.user is missing');
            yield _this.authorize(this.state.user, authSpec, this);
            yield next;
          };

          // Call the corresponding (http) method on the wrapped koa-router:
          this.koaRouter[method](route, authMiddleware, middleware);
        }
        else {
          // Call the corresponding (http) method on the wrapped koa-router:
          this.koaRouter[method](route, middleware);
        }

        return this; // enable chaining
      };
    });

    /**
     * Chainable method that registers an activity.
     * @param {string} activity
     * @returns {AuthRouter}
     */
    this.registerActivity = function (activity) {
      this._toRegister.add(activity);
      return this; // enable chaining
    };

    this.del = this.delete;
  }

  /**
   * Returns a promise that resolves when the given user is authorized according to the given auth
   * specification.
   * @param {String} user
   * @param {String|function} authSpec - This argument can be a string, i.e. the name of the
   *        activity the user must be authorized to access. Alternatively you can provide a function
   *        that returns a boolean or a promise, in which case the authorization middleware will
   *        call this function and authorize the user when it returns `true` or resolves. This
   *        function is called with one argument, the `can` function, which you can call with one or
   *        more activity labels and will return true when the user is authorized for one of these
   *        activities. You can use this `can` function when you need to combine an activity-based
   *        authorization with an arbitrary assertion.
   * @param {Object} ctx - The koa context.
   * @throws A ServerError with status 500 when the activity is unknown.
   * @throws A ServerError with status 403 when the user is not authorized.
   */
  authorize(user, authSpec, ctx) {
    //log.debug('>> authorize() - authSpec, user:', authSpec, user);
    return new Promise((resolve, reject) => {
      if (user.isRoot) {
        // The user is an admin, which can do anything...
        resolve();
      }
      else if (_.isString(authSpec)) {
        // The authSpec is an activity label, throw error if the use is not authorized:
        const actIdx = this._actIdxMap[authSpec];
        //log.debug(' authorize() - actIdx, hasIndex(..):', actIdx, BigBitmap.hasIndex(user.abm, actIdx));
        if (_.isUndefined(actIdx)) {
          const msg = `Could not find the activity-index for '${authSpec}'.`;
          log.warn(msg);
          reject(new ServerError(msg, 500));
        }
        else if (!BigBitmap.hasIndex(user.abm, actIdx)) {
          reject(new ServerError(`Not authorized.`, 403));
        }
        else {
          resolve();
        }
      }
      else {
        // The authSpec is a function. The result of calling this function determines whether
        // the user is authorized...
        const can = (...activities) => {
          return !_.isUndefined(activities) && activities.some((activity) => {
            return BigBitmap.hasIndex(user.abm, this._actIdxMap[activity]);
          });
        };
        Promise.resolve(authSpec.call(ctx, can)).then(
          (authorized) => authorized ? resolve() : reject(new ServerError(`Not authorized.`, 403)),
          (error) => { throw new ServerError(`Not authorized.`, 403); });
      }
    });
  }

  /**
   * This method should be called after adding all routes on this router. It will register the
   * activities declared for the secure routes in the AuthManager, which will map it to activity
   * indices and return the resulting map, which is used when authorizing access requests.
   * @returns {Promise}
   */
  registerActivities() {
    //log.trace('>> registerActivities()');
    const activities = [...this._toRegister.values()];
    delete this._toRegister;
    if (activities.length === 0) {
      return Promise.resolve();
    }
    else if (this.authManager) {
      log.info(`Locally registering router activities [${activities.join(', ')}].`);
      return this.authManager.registerActivities(activities)
        .then(() => (this._actIdxMap = this.authManager.activityIndexMap(activities)));
    }
    else {
      const route = `http://${this.authHost}:8001/auth/activities/`;
      log.info(`Remotely registering router activities [${activities.join(', ')}] on ${route}.`);
      const retryOpts = {
        factor: 1.5,
        retries: 100,
        minTimeout: 3000
      };
      return retryPromise(retryOpts, (resolve, retry) => {
        axios.patch(route, { activities })
          .then((response) => {
            this._actIdxMap = response.data;
            resolve();
          })
          .catch((error) => {
            const msg = `Failed to register the activities on the soyl-auth service.${error.message}`;
            log.error(msg);
            retry(msg);
          });
      })
    }
  }

  /**
   * @returns {KoaRouter} The koa-router instance.
   */
  get router() { return this.koaRouter; }

  /**
   * Delegate to the `param` method of the underlying koa-router instance.
   * @param {*} args
   * @returns {AuthRouter}
   */
  param(...args) {
    this.koaRouter.param(...args);
    return this;
  }

  /**
   * Delegate to the `routes` method of the underlying koa-router instance.
   * @returns {function}
   */
  routes() {
    return this.koaRouter.routes();
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = AuthRouter;
