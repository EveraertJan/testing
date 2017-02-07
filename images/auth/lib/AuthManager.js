'use strict';

/**
 * @module soyl-auth/AuthManager
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 *
 * Resources:
 * - https://www.sitepoint.com/using-redis-node-js/
 */

const assert = require('assert');

const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt')); // must come after Promise import
const jwt = require('cargo-lib/api/jwt');
const arrayDiff = require('cargo-lib/utils/arrayDiff');
const BigBitmap = require('cargo-lib/utils/BigBitmap');
const ServerError = require('cargo-lib/utils/ServerError');
const _ = require('lodash');
const log4js = require('log4js');
const redis = require('redis');
const ftpromise = require('retrying-promise');

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

// -------------------------------------------------------------------------------------------------

const SALT_ROUNDS = 10;

const FTPROMISE_CONFIG = {
  factor: 1,
  minTimeout: 2000
};

const ROLES_HASH = 'roles';
const USERS_HASH = 'users';

const NEXT_INDEX = 'next_activity_index';
const ACTIVITY_INDEX = 'activity_index';

const log = log4js.getLogger('AuthManager');

// -------------------------------------------------------------------------------------------------

class AuthManager {

  /**
   * @param {number} jwtExpiresIn
   * @param {String} jwtSecret
   * @param {String} redisHost
   * @param {Boolean} [resetActivityMap = false] Resets the existing activity bitmap index mapping.
   *        As a consequence the authorized activity bitmap in the previously issued JWT-token are
   *        no longer correct. You should thus also use a new JWT-secret in order to invalidate all
   *        existing tokens.
   * @param {Boolean} [resetAll = false] Removes all data from the data store at start-up.
   * @returns {Promise} A promise that initializes the authManager.
   */
  initialize({ jwtExpiresIn, jwtSecret, redisHost, resetActivityMap = false, resetAll = false }) {
    //log.debug('# NEW', jwtExpiresIn, jwtSecret, redisHost);
    assert(_.isNumber(jwtExpiresIn), `The jwtExpiresIn argument must be a number, got ${jwtExpiresIn}.`);
    assert(_.isString(jwtSecret), `The jwtSecret argument must be a string, got ${jwtSecret}.`);
    assert(_.isString(redisHost), `The redisHost argument must be a string, got ${redisHost}.`);
    assert(_.isBoolean(resetActivityMap), `The resetActivityMap argument must be a boolean, got ${resetActivityMap}.`);
    assert(_.isBoolean(resetAll), `The resetAll argument must be a boolean, got ${resetAll}.`);
    this._jwtExpiresIn = jwtExpiresIn;
    this._jwtSecret = jwtSecret;
    this._nextIndex = 0;
    return Promise.coroutine(function* () {
      yield this._initRedisClient(redisHost);
      if (resetAll) {
        yield this.redis.flushdbAsync();
      }
      else if (resetActivityMap) {
        yield* this._resetActivityMap();
      }
      yield* this._loadActivities();
    }.bind(this))();
  }

  _initRedisClient(redisHost) {
    assert(_.isString(redisHost), `The redisHost argument must be a string, got ${redisHost}.`);
    return ftpromise(FTPROMISE_CONFIG, (resolve, retry, reject) => {
      this.redis = redis.createClient({ host: redisHost });

      // The initial `ready` handler:
      this.redis.on('ready', msg => {
        //log.trace("Redis client is ready");

        // Now that the client is ready, we can remove the initial `ready` and `error` handlers
        // and start monitoring the client:
        this.redis.removeAllListeners('ready');
        this.redis.removeAllListeners('error');
        this._monitorRedisClient();

        resolve(this);
      });

      // The initial `error` handler:
      this.redis.on('error', error => {
        log.error(`Failed to initialize the redis client. ${error}`);
        this.redis.removeAllListeners();
        retry(error);
      });
    });
  }

  /** @private */
  _monitorRedisClient() {
    // connect handler:
    this.redis.on('connect', () => {
      log.error(`The redis client reconnected.`);
    });

    // reconnecting handler:
    this.redis.on('reconnecting', (options) => {
      log.error(`The redis client is trying to reconnect (delay: ${options.delay}, attempt #${options.attempt}`);
    });

    // error handler:
    this.redis.on('error', (error) => {
      log.error(`The redis client erred. ${error}`);
    });

    // end handler:
    this.redis.on('end', () => {
      log.error(`The redis client ended unexpectedly.`);
    });

    // warning handler:
    this.redis.on('warning', (warning) => {
      log.error(`The redis client warns: ${warning}.`);
    });
  }

  /**
   * Returns a promise that stops the Redis client, which is then no longer available.
   * @returns {Promise}
   */
  stop() {
    return new Promise((resolve) => {
      //log.debug(`Stopping Redis client.`);
      if (!this.redis) { resolve(); }
      this.redis.removeAllListeners();
      this.redis.on('end', resolve);
      this.redis.on('warning', (warning) => {
        log.error(`The redis client warns while quiting: ${warning}.`);
      });
      this.redis.on('error', (error) => {
        log.error(`The redis client erred while quiting. ${error}`);
      });
      this.redis.quit();
      delete this.redis;
    });
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Role management:

  /**
   * Returns a promise that resolves to true if the given role exists, or false otherwise.
   * @param {String} role - The name of the role.
   * @returns {Promise.<Boolean>}
   */
  hasRole(role) {
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    return this.redis.hexistsAsync(ROLES_HASH, role).then((r) => r === 1);
  }

  /**
   * Returns a promise that resolves to an array of boolean values, one for each name in the given
   * order. These values are true if the corresponding role exists, or false otherwise.
   * @param {Array.<String>} roles
   * @returns {Promise.<Array.<Boolean>>}
   */
  hasRoles(roles) {
    assert(_.isArray(roles), `The roles argument must be an array, got ${roles}.`);
    return Promise.map(roles, (role) => this.hasRole(role));
  }

  /**
   * Returns a promise that resolves to an array with the role names for unknown roles.
   * @param {Array.<String>} roles - The names of the roles.
   * @returns {Promise.<Array.<String>>}
   */
  unknownRoles(roles) {
    assert(_.isArray(roles), `The roles argument must be an array, got ${roles}.`);
    return Promise.filter(roles, (role) => this.hasRole(role).then(b => !b));
  }

  /**
   * Returns a promise that resolves if the given role exists, or rejects with a 404 server error
   * otherwise.
   * @param {String} role - The name of the role.
   * @returns {Promise}
   */
  assertRole(role) {
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    return this.redis.hexistsAsync(ROLES_HASH, role)
      .then((r) => {
        if (r !== 1) {
          throw new ServerError(`Role '${role}' not found.`, 404);
        }
      });
  }

  /**
   * Returns a promise that adds a new role.
   * Rejects with 409 error if there is already a role with the given name.
   * @param {String} role - The name of the role.
   * @param activities
   * @returns {Promise}
   */
  addRole(role, activities) {
    assert(_.isString(role), 'The role argument must be a string.');
    if (_.isUndefined(activities) || _.isNull(activities)) { activities = []; }
    assert(_.isArray(activities), `The activities argument must be an array, got: ${activities}.`);
    return Promise.coroutine(function* () {
      const exists = yield this.redis.hexistsAsync(ROLES_HASH, role);
      if (exists === 1) { throw new ServerError('Role already exists.', 409); }
      yield this.redis.hmsetAsync(ROLES_HASH, role, 1);
      if (activities.length > 0) {
        const map = {};
        activities.forEach((act) => (map[act] = 1));
        yield this.redis.hmsetAsync(`role:${role}:activities`, map);
      }
      this.registerActivities(activities);
    }.bind(this))();
  }

  /**
   * @typedef {Object} Role
   * @property {String} Role.name - The name of the role.
   * @property {Array.<String>} Role.activities
   * @property {Array.<String>} Role.users
   */

  /**
   * Returns a promise that resolves to a Role object if the given role exists, or rejects
   * otherwise.
   * @param {String} role - The name of the role.
   * @returns {Promise.<Role>}
   */
  getRole(role) {
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    return Promise.coroutine(function* () {
      yield this.assertRole(role);
      const activities = yield this.redis.hkeysAsync(`role:${role}:activities`);
      const users = yield this.redis.hkeysAsync(`role:${role}:users`);
      return { activities, name: role, users };
    }.bind(this))();
  }

  /**
   * @returns {Promise.<Role>} A promise that resolves to an array with all the roles.
   */
  getRoles() {
    return this.redis.hkeysAsync(ROLES_HASH).map((map) => this.getRole(map));
  }

  /**
   * @returns {Promise.<Map.<String, Role>>} A promise that resolves to a Map with all the roles
   *          mapped by its name.
   */
  getRolesMap() {
    return this.getRoles().reduce((map, role) => map.set(role.name, role), new Map());
  }

  /**
   * Returns a promise that removes the given role. This role is also removed from the user-roles in
   * which is was included.
   * @param {String} role - The name of the role.
   * @param {boolean} [assertRemoval = false] When true then the complete removal is asserted. To be
   *        used in unit-tests.
   * @returns {Promise}
   */
  removeRole(role, assertRemoval = false) {
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    return Promise.coroutine(function* () {
      yield this.assertRole(role);
      yield this.redis.hdelAsync(ROLES_HASH, role);
      yield this.redis.delAsync(`role:${role}:activities`);

      let users = yield this.redis.hkeysAsync(`role:${role}:users`);
      if (users.length > 0) {
        Promise.each(users, (user) => this.redis.hdelAsync(`user:${user}:roles`, role));
      }
      yield this.redis.delAsync(`role:${role}:users`);

      if (assertRemoval) {
        const activities = yield this.redis.hkeysAsync(`role:${role}:activities`);
        assert(activities.length === 0);
        users = yield this.redis.hkeysAsync(`role:${role}:users`);
        assert(users.length === 0);
      }
    }.bind(this))();
  }

  /**
   * Returns a promise that updates a role. All properties are overwritten with the given values.
   * @param {String} role - The name of the role.
   * @param {Array.<String>} [activities = []] - The list of roles for this user.
   * @returns {Promise}
   */
  updateRole(role, activities = []) {
    //log.debug('> updateRole - activities:', activities);
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    if (_.isUndefined(activities) || _.isNull(activities)) { activities = []; }
    assert(_.isArray(activities), `The activities argument must be an array, got ${activities}.`);
    return Promise.coroutine(function* () {
      yield this.assertRole(role);
      const oldActivities = yield this.redis.hkeysAsync(`role:${role}:activities`);
      const [toRemove] = arrayDiff(oldActivities, activities);
      if (toRemove.length > 0) {
        yield this.redis.hdelAsync(`role:${role}:activities`, ...toRemove);
      }
      if (activities.length > 0) {
        // Add all given activities instead of just the new ones, just to make sure...
        yield Promise.each(activities, (act) => this.redis.hmsetAsync(`role:${role}:activities`, act, 1));
        this.registerActivities(activities);
      }
    }.bind(this))();
  }

  addRoleActivities(role, ...activities) {
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    if (_.isUndefined(activities) || _.isNull(activities)) { activities = []; }
    assert(_.isArray(activities), `The activities argument must be an array, got ${activities}.`);
    return Promise.coroutine(function* () {
      if (activities.length === 0) { return; }
      yield this.assertRole(role);
      yield Promise.each(activities, (act) => this.redis.hmsetAsync(`role:${role}:activities`, act, 1));
      this.registerActivities(activities);
    }.bind(this))();
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // User management:

  /**
   * Returns a promise that resolves to true if the given user exists, or false otherwise.
   * @param {String} username - The username.
   * @returns {Promise.<boolean>}
   */
  hasUser(username) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    return this.redis.hexistsAsync(USERS_HASH, username).then((r) => r === 1);
  }

  /**
   * Returns a promise that resolves if the given user exists, or rejects with a 404 server error
   * otherwise.
   * @param {String} username - The username.
   * @returns {Promise}
   */
  assertUser(username) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    return this.redis.hexistsAsync(USERS_HASH, username)
      .then((r) => {
        if (r !== 1) {
          throw new ServerError('User not found.', 404);
        }
      });
  }

  /**
   * Returns a promise that adds a user. Reject with 409 error if the user already exists.
   * @param {String} username - The username.
   * @param {String} password
   * @param {Array.<String>} [roles = []] - The list of roles for this user.
   * @param {Boolean} [isRoot = false] - When true then this user has all activity rights.
   * @returns {Promise}
   */
  addUser(username, password, roles = [], isRoot = false) {
    assert(_.isString(password), 'The password argument must be a string.');
    if (_.isUndefined(roles) || _.isNull(roles)) { roles = []; }
    assert(_.isArray(roles), `The roles argument must be an array, got ${roles}.`);
    return Promise.coroutine(function* () {
      const exists = yield this.redis.hexistsAsync(USERS_HASH, username);
      if (exists === 1) { throw new ServerError('User already exists.', 409); }

      if (roles && roles.length > 0) {
        const missingRoles = yield this.unknownRoles(roles);
        if (missingRoles.length > 0) {
          throw new ServerError(`Unknown roles: ${missingRoles}.`, 409);
        }
      }
      const hash = yield bcrypt.hashAsync(password, SALT_ROUNDS);
      yield this.redis.hmsetAsync(USERS_HASH, username, 1);
      yield this.redis.hmsetAsync(`user:${username}`, 'hash', hash);
      yield this.redis.hmsetAsync(`user:${username}`, 'isRoot', isRoot ? 1 : 0);
      if (roles && roles.length > 0) {
        yield Promise.each(roles, (role) => {
          return this.redis.hmsetAsync(`role:${role}:users`, username, 1)
            .then(() => this.redis.hmsetAsync(`user:${username}:roles`, role, 1));
        });
      }
    }.bind(this))();
  }

  /**
   * Returns a promise that resolves to true when the user with the given username is root.
   * @param {String} username - The username.
   * @returns {Promise.<boolean>}
   */
  isRoot(username) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    return this.redis.hgetAsync(`user:${username}`, 'isRoot').then((r) => r === '1');
  }

  /**
   * @typedef {Object} User
   * @property {Array.<String>} [User.activities] -
   * @property {String} User.hash - The password hash.
   * @property {Boolean} User.isRoot -
   * @property {Array.<String>} User.roles -
   * @property {String} User.username - The username.
   */

  /**
   * Returns a promise that resolves to the User object if the given user exists, or rejects
   * otherwise.
   * @param {String} username - The username.
   * @param {boolean} includeActivities - True to include the activities for this user.
   * @returns {Promise.<User>}
   */
  getUser(username, includeActivities = false) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    assert(_.isBoolean(includeActivities),
      `The includeActivities argument must be a boolean, got ${includeActivities}.`);
    return Promise.coroutine(function* () {
      yield this.assertUser(username);
      const hash = yield this.redis.hgetAsync(`user:${username}`, 'hash');
      const isRoot = yield this.isRoot(username);
      const roles = yield this.redis.hkeysAsync(`user:${username}:roles`);

      if (includeActivities) {
        const actSet = new Set();
        yield Promise.each(roles, (role) => {
          return this.redis.hkeysAsync(`role:${role}:activities`)
            .each((activity) => actSet.add(activity));
        });
        return { activities: [...actSet], isRoot, roles, username };
      }
      else {
        return { isRoot, roles, username };
      }
    }.bind(this))();
  }

  /**
   * @param {boolean} includeActivities - True to include the activities for this user.
   * @returns {Promise.<User>} A promise that resolves to an array with all the users.
   */
  getUsers(includeActivities = false) {
    assert(_.isBoolean(includeActivities),
      `The includeActivities argument must be a boolean, got ${includeActivities}.`);
    return this.redis.hkeysAsync(USERS_HASH).map((name) => this.getUser(name, includeActivities));
  }

  /**
   * @returns {Promise.<Map.<String, User>>} A promise that resolves to a Map with all the users
   *          mapped by their username.
   */
  getUsersMap() {
    return this.getUsers().reduce((map, user) => map.set(user.username, user), new Map());
  }

  /**
   * Returns a promise that deletes the user with the given username.
   * Rejects with a 404 error when the user does not exists.
   * Rejects with a 405 error when the authorized user tries to delete herself.
   * @param {String} username - The username.
   * @param {Boolean} [assertRemoval = false] When true then the proper removal of all keys is
   *        asserted. To be used for unit-testing.
   * @returns {Promise}
   */
  removeUser(username, assertRemoval = false) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    assert(_.isBoolean(assertRemoval),
      `The assertRemoval argument must be a boolean, got ${assertRemoval}.`);
    return Promise.coroutine(function* () {
      yield this.assertUser(username);
      yield this.redis.hdelAsync(USERS_HASH, username);
      yield this.redis.hkeysAsync(`user:${username}:roles`)
        .each((role) => this.redis.hdelAsync(`role:${role}:users`, username));
      const keys = [`user:${username}`, `user:${username}:roles`];
      yield this.redis.delAsync(keys);

      if (assertRemoval) {
        const roles = yield this.redis.hkeysAsync(`user:${username}:roles`);
        assert(roles.length === 0);
        yield Promise.each(keys, (key) => this.redis.existsAsync(key)
          .then((res) => assert.equal(res, 0)));
      }
    }.bind(this))();
  }

  /**
   * Returns a promise that updates the given properties of the given user.
   * @param {String} username - The username of the user to update.
   * @param {Boolean} [isRoot] - When true then this user has all rights.
   * @param {String} [password]
   * @param {Array.<String>} [roles] - The list of roles for this user.
   * @returns {Promise}
   */
  updateUser(username, { isRoot, password, roles }) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    return Promise.coroutine(function* () {
      yield this.assertUser(username);

      // Detect inconsistencies before committing updates to Redis.
      if (_.isArray(roles) && roles.length > 0) {
        const missingRoles = yield this.unknownRoles(roles);
        if (missingRoles.length > 0) {
          throw new ServerError(`Unknown roles: ${missingRoles}.`, 409);
        }
      }

      if (_.isBoolean(isRoot)) {
        yield this.redis.hmsetAsync(`user:${username}`, 'isRoot', isRoot ? 1 : 0);
      }

      if (_.isString(password)) {
        const hash = yield bcrypt.hashAsync(password, SALT_ROUNDS);
        yield this.redis.hmsetAsync(`user:${username}`, 'hash', hash);
      }

      if (_.isArray(roles)) {
        const oldRoles = yield this.redis.hkeysAsync(`user:${username}:roles`);
        const [toRemove] = arrayDiff(oldRoles, roles);
        if (toRemove.length > 0) {
          yield this.redis.hdelAsync(`user:${username}:roles`, ...toRemove);
          yield Promise.each(toRemove, (role) => this.redis.hdelAsync(`role:${role}:users`, username));
        }
        if (roles.length > 0) {
          // Add all given roles instead of just the new ones, just to be sure...
          for (const role of roles) {
            yield this.redis.hmsetAsync(`user:${username}:roles`, role, 1);
            yield this.redis.hmsetAsync(`role:${role}:users`, username, 1);
          }
        }
      }
    }.bind(this))();
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Users & Roles:

  /**
   * Returns a promise that adds the given role for the given user.
   * Rejects with 404 erorr when either the user or the role is unknown.
   * @param {String} username - The name of the user.
   * @param {String} role - The name of the role.
   * @returns {*}
   */
  addUserRole(username, role) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    return Promise.coroutine(function* () {
      yield this.assertRole(role);
      yield this.assertUser(username);
      yield this.redis.hmsetAsync(`user:${username}:roles`, role, 1);
      yield this.redis.hmsetAsync(`role:${role}:users`, username, 1);
    }.bind(this))();
  }

  /**
   * Returns a promise that removes the given role for the given user.
   * Rejects with 404 erorr when either the user or the role is unknown.
   * @param {String} username - The name of the user.
   * @param {String} role - The name of the role.
   * @returns {*}
   */
  removeUserRole(username, role) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    assert(_.isString(role), `The role argument must be a string, got ${role}.`);
    return Promise.coroutine(function* () {
      yield this.assertRole(role);
      yield this.assertUser(username);
      yield this.redis.hdelAsync(`user:${username}:roles`, role);
      yield this.redis.hdelAsync(`role:${role}:users`, username);
    }.bind(this))();
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Activities:

  /**
   * Returns the (in-memory) activity-to-index map, either limited to the given activities, or all
   * activities when none are given.
   * @param {Array.<String>} [activities] - Optional list of activities.
   * @returns {Object} The activity-to-index map.
   */
  activityIndexMap(activities) {
    if (_.isArray(activities)) {
      return activities.reduce((map, act) => {
        map[act] = this.actIdxMap[act];
        return map;
      }, {});
    }
    else {
      return this.actIdxMap;
    }
  }

  /**
   * @param {String} activity
   * @returns {Number} The index of the given activity.
   */
  activityIndex(activity) {
    assert(_.isString(activity), `The activity argument must be a string, got ${activity}.`);
    return this.actIdxMap[activity];
  }

  /**
   * Returns a promise that registers the given activities.
   * @param {Array.<String>} activities
   */
  registerActivities(activities) {
    assert(_.isArray(activities), `The activities argument must be an array, got ${activities}.`);
    return Promise.coroutine(function* () {
      const newActIdxMap = {};
      let newAct = false;
      activities.forEach((act) => {
        if (_.isUndefined(this.actIdxMap[act])) {
          let idx = this._nextIndex++;
          this.actIdxMap[act] = idx;
          newActIdxMap[act] = idx;
          newAct = true;
        }
      });
      if (newAct) {
        yield this.redis.hmsetAsync(ACTIVITY_INDEX, newActIdxMap);
        yield this.redis.setAsync(NEXT_INDEX, this._nextIndex);
      }
    }.bind(this))();
  }

  /**
   * Returns a promise that removes the given activities from the activity-index map.
   * @param {Array.<String>} activities
   * @returns {Promise}
   */
  removeActivities(...activities) {
    assert(_.isArray(activities), `The activities argument must be an array, got ${activities}.`);
    if (activities.length === 0) { return Promise.resolve(); }
    return Promise.coroutine(function* () {
      // First try to minimize next index - Note that this may result in a security breach as
      // existing tokens that have access to the removed activities, can access unauthorized
      // features assigned to the recycled id.
      //const ary = [];
      //Object.keys(this.actIdxMap).forEach((act) => (ary[this.actIdxMap[act]] = act));
      //while (this._nextIndex > 0) {
      //  if (!ary[this._nextIndex - 1]) {
      //    this._nextIndex--;  // is empty
      //  }
      //  else if (activities.includes(ary[this._nextIndex - 1])) {
      //    this._nextIndex--;  // to remove
      //  }
      //  else { break; }
      //}
      //yield this.redis.setAsync(NEXT_INDEX, this._nextIndex);

      // Remove the index mappings:
      activities.forEach((act) => (delete this.actIdxMap[act]));
      yield this.redis.hdelAsync(ACTIVITY_INDEX, ...activities);
    }.bind(this))();
  }

  /**
   * Returns a promise that resolves to an array with the activity labels the given user is
   * authorized to perform.
   * @param {String} username - The username.
   * @returns {Promise.<Array.<string>>}
   */
  userActivities(username) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    return Promise.coroutine(function* () {
      yield this.assertUser(username);
      const roles = yield this.redis.hkeysAsync(`user:${username}:roles`);
      const acts = new Set();
      yield Promise.each(roles, (role) => {
        return this.redis.hkeysAsync(`role:${role}:activities`)
          .each((activity) => acts.add(activity));
      });
      return [...acts.values()];
    }.bind(this))();
  }

  /**
   * Loads the activities from Redis. To be called once at start-up.
   * @returns {Promise}
   * @private
   */
  *_loadActivities() {
    // Load the activity count:
    this._nextIndex = yield this.redis.getAsync(NEXT_INDEX);
    if (!this._nextIndex) {
      this._nextIndex = 0;
      yield this.redis.setAsync(NEXT_INDEX, this._nextIndex);
    }
    // Load the activities indices:
    this.actIdxMap = yield this.redis.hgetallAsync(ACTIVITY_INDEX).then((obj) => obj || {});
    Object.keys(this.actIdxMap).forEach((key) => {
      this.actIdxMap[key] = parseInt(this.actIdxMap[key]);
    });
  }

  /**
   * Returns a promise that resolves to the activities bitmap with all activities for all roles
   * assigned to this user set to true.
   * @param {String} username - The username.
   * @returns {Promise}
   * @private
   */
  *_userActivitiesBitmap(username) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    yield this.assertUser(username);
    const abm = new BigBitmap();
    yield this.redis.hkeysAsync(`user:${username}:roles`)
      .each((role) => this.redis.hkeysAsync(`role:${role}:activities`)
        .map((activity) => [activity, this.actIdxMap[activity]])
        .each(([activity, idx]) => {
          if (_.isUndefined(idx)) {
            throw new ServerError(`There is no index for activity '${activity}' in the activity-index-map (in AuthManager._userActivitiesBitmap).`)
          }
          return abm.add(idx);
        }));
    return abm;
  }

  /**
   * Returns a promise that resets the existing activity bitmap index mapping. As a consequence the
   * authorized activity indices contained in existing JWT-tokens are no longer valid. These tokens
   * should thus be invalidates, e.g. by using a new JWT-secret.
   * @returns {Promise}
   * @private
   */
  *_resetActivityMap() {
    yield this.redis.setAsync(NEXT_INDEX, 0);
    const keys = yield this.redis.hkeysAsync(ACTIVITY_INDEX);
    if (keys.length > 0) {
      yield this.redis.hdelAsync(ACTIVITY_INDEX, ...keys);
    }
    this.actIdxMap = {};
    this._nextIndex = 0;
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Auth methods:

  getToken(username) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    return Promise.coroutine(function* () {
      const abm = yield* this._userActivitiesBitmap(username);
      const isRoot = yield this.isRoot(username);
      const payload = {
        username,
        isRoot,
        abm: abm.toString()
      };
      const opts = { expiresIn: this._jwtExpiresIn };
      return jwt.sign(payload, this._jwtSecret, opts);
      //return yield jwt.sign(payload, this._jwtSecret, opts);
    }.bind(this))();
  }

  /**
   * Returns a promise that resolves when the given user is authenticated, or rejects otherwise.
   * The promise resolves to the user object.
   * @param {String} username
   * @param {String} password
   * @returns {Promise}
   */
  authenticate(username, password) {
    assert(_.isString(username), `The username argument must be a string, got ${username}.`);
    assert(_.isString(password), `The password argument must be a string, got ${password}.`);
    return Promise.coroutine(function* () {
      const hash = yield this.redis.hgetAsync(`user:${username}`, 'hash');
      const authenticated = yield bcrypt.compareAsync(password, hash);
      if (!authenticated) {
        throw new ServerError('Wrong password', 401);
      }
      return this.getUser(username, true);
    }.bind(this))();
  }

  /**
   * Returns a promise that resolves to true if the given user is authorized to perform the given
   * activity, or false otherwise.
   * @param {String} token - The JWT-token of the user to authorize.
   * @param {Number} activityIndex - The activity index.
   * @returns {Promise.<boolean>}
   */
  authorize(token, activityIndex = -1) {
    assert(_.isString(token), `The token argument must be a string, got ${token}.`);
    assert(_.isNumber(activityIndex), `The activityIndex argument must be a number, got ${activityIndex}.`);
    return Promise.coroutine(function* () {
      const decoded = jwt.verify(token, this._jwtSecret);
      if (decoded.isRoot) { return true; }
      let abm = new BigBitmap(decoded.abm);
      return abm.has(activityIndex);
    }.bind(this))();
  }

  /**
   * Deletes all data.
   */
  reset() {
    return Promise.coroutine(function* () {
      yield this.redis.flushdbAsync();
      yield* this._resetActivityMap();
      yield* this._loadActivities();
    }.bind(this))();
  }

  /**
   * Returns a promise that checks the consistency of the stored data.
   */
  *assertConsistency() {
    // Assert that the in-memory activity-index-map equals the stored map:
    const maim = this.actIdxMap;
    const saim = yield this.redis.hgetallAsync(ACTIVITY_INDEX).then((obj) => obj || {});
    Object.keys(saim).forEach((key) => (saim[key] = parseInt(saim[key])));
    assert.deepEqual(maim, saim);

    const roles = yield this.getRoles(); // -> { name, activities, users }
    const rolesMap = yield this.getRolesMap();
    const users = yield this.getUsers(); // -> { username, isRoot, roles }
    const usersMap = yield this.getUsersMap();

    // Assert that for each role:
    // - the properties are properly types;
    // - for each activity assigned to this role:
    //   - the activity is in the activity-index-map;
    // - for each user associated with the role:
    //   - the user is known;
    //   - the role is in the user's roles list;
    roles.forEach((role) => {
      assert(_.isString(role.name));
      assert(_.isArray(role.users));
      assert(_.isArray(role.activities));
      role.activities.forEach((activity) => {
        assert(!_.isUndefined(maim[activity]),
          `Role '${role.name}' has an activity '${activity}' that is not in the act-idx-map.`);
      });
      role.users.forEach((username) => {
        assert(usersMap.has(username),
          `Role '${role.name}' has an unknown user '${username}'.`);
        assert(usersMap.get(username).roles.includes(role.name),
          `Role '${role.name}' is not in the roles list of user '${username}'.`);
      });
    });

    // Assert that for each user:
    // - the properties are properly types;
    // - for each role assigned to the user:
    //   - the role is known;
    //   - the user is in the role's users list;
    for (const user of users) {
      assert(_.isString(user.username));
      assert(_.isBoolean(user.isRoot));
      assert(_.isArray(user.roles));
      user.roles.forEach((role) => {
        assert(rolesMap.has(role),
          `User '${user.username}' has an unknown role '${role}'.`);
        assert(rolesMap.get(role).users.includes(user.username),
          `User '${user.username}' is not in the users list of role '${role}'.`);
      });
      const hash = yield this.redis.hgetAsync(`user:${user.username}`, 'hash');
      assert(_.isString(hash));
    }
  }

}

// -------------------------------------------------------------------------------------------------

module.exports = AuthManager;
