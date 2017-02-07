'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');

//const Promise = require('bluebird');
const CargoApp = require('cargo-lib/CargoApp');
const prependError = require('cargo-lib/utils/prependError');
const ServerError = require('cargo-lib/utils/ServerError');
const _ = require('lodash');
const log4js = require('log4js');

const AuthManager = require('./AuthManager');

const log = log4js.getLogger('App');

class App extends CargoApp {

  constructor(opts) {
    super(opts);

    // The authManager instance must be set here, in the constructor, so that it is available when
    // the CargoApp creates the CargoApi.
    this.authManager = new AuthManager();
  }

  /** @inheritdoc */
  *onStart() {
    // Initialize the auth-manager:
    yield this.authManager.initialize({
      jwtExpiresIn: this.config.get('soyl.auth.jwtExpiresIn'),
      jwtSecret: this.config.get('soyl.auth.jwtSecret'),
      redisHost: this.config.get('soyl.auth.storeHost')
      //resetActivityMap: true
    });

    yield* this.authManager.assertConsistency();
    yield* this.loadActivities();
    yield* this.loadDefaultRoles();
    yield* this.loadDefaultUsers();
    if (this.config.devMode) {
      yield* this.loadDevUsers();
    }

    // Serve the Sign-In-API:
    // This api should be used by clients to sign in users.
    this.serveApi((router) => this.initSignInApi(router));

    // Serve the Sys-Auth-API:
    // This api must only be used by services that serve a protected api. It is therefore served
    // on a port that is not exposed to the outside world.
    this.serveApi({ port: 8001 }, (router) => this.initSysAuthApi(router));

    // Serve the Roles-and-Users-API:
    // This protected api serves user and role management.
    let opts = {
      authManager: this.authManager,
      route: '/auth'
    };
    this.serveSecureApi(opts, (router) => this.initSecureApi(router), true);

    //this.initAuthSocketAPI();
  }

  *loadActivities() {}

  *loadDefaultRoles() {
    const roles = this.config.get('soyl.auth.defaultRoles');
    for (const { id, activities } of roles) {
      const exists = yield this.authManager.hasRole(id);
      log.info(`Adding/Updating role '${id}'.`);
      if (!exists) {
        yield this.authManager.addRole(id, activities);
      }
      else {
        yield this.authManager.updateRole(id, activities);
      }
    }
  }

  *loadDefaultUsers() {
    // Add the root user:
    let exists = yield this.authManager.hasUser('root');
    if (!exists) {
      log.info('Adding default `root` superuser.');
      const pw = this.config.get('soyl.auth.initialRootPassword');
      yield this.authManager.addUser('root', pw, null, true);
    }
  }

  *loadDevUsers() {
    const users = this.config.get('soyl.auth.devUsers');
    for (const { password, roles, username } of users) {
      log.info(`Adding/Updating dev user '${username}'.`, password);
      const exists = yield this.authManager.hasUser(username);
      if (exists) {
        //yield this.authManager.removeUser(username);
        //yield this.authManager.addUser(username, password, roles);
        yield this.authManager.updateUser(username, { roles });
      }
      else {
        yield this.authManager.addUser(username, password, roles);
      }
    }
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  *onStop() {
    try { yield this.authManager.stop(); } catch (error) {}
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  initSignInApi(router) {
    const authManager = this.authManager;
    router
      /**
       * Authenticates the given user. When authenticated, the response is an object with a `user`
       * property, an object that has the following properties:
       * - `activities` : An array with the activity labels this user is authorized to perform.
       * - `isRoot` : True when this user is a superuser.
       * - `roles` : An array with the role labels assigned to this user.
       * - `token` : The JWT-token to pass with subsequent API calls.
       * - `username` : The username.
       * When the user could not be authenticated, then the response is an object with an `error`
       * property, which is a string that describes the failure reason.
       */
      .post('/auth/authenticate/', function* () {
        //log.debug('POST /authenticate/');
        const { username, password } = this.request.body;
        try {
          const user = yield authManager.authenticate(username, password);
          user.token = yield authManager.getToken(username);
          this.body = { user };
        }
        catch (error) {
          log.warn('POST /authenticate/ > error:', error, username, password);
          this.body = { error: error.message };
        }
      });
  }

  initSysAuthApi(router) {
    const authManager = this.authManager;
    router
      /**
       * Get the token for the given service. The token will only be dispatched when this service is
       * registered in the `soyl.auth.secureServices` list in the system configuration. A 403
       * response will be given for unregistered services.
       */
      .get('/auth/services/:service/token/', function* () {
        // TODO
      })
      .patch('/auth/activities/', function* () {
        //log.debug('PATCH activities', this.request.body.activities);
        const activities = this.request.body.activities;
        yield authManager.registerActivities(activities);
        this.body = yield authManager.activityIndexMap(activities);
      });
  }

  initSecureApi(router) {
    this.initRolesApi(router);
    this.initUsersApi(router);
  }

  initRolesApi(router) {
    const authManager = this.authManager;
    router
      .get('/roles', 'duxis/view_users', function* () {
        const roles = yield authManager.getRoles();
        this.set('X-total-count', roles.length);
        this.body = { roles };
      })
      .get('/roles/:role/', 'duxis/view_users', function*() {
        const { activities } = yield authManager.getRole(this.params.role);
        this.body = { activities };
      })
      .post('/roles/:role/', 'duxis/manage_users', function*() {
        const { activities } = this.request.body;
        yield authManager.addRole(this.params.role, activities);
        this.status = 204;
      })
      .del('/roles/:role/', 'duxis/manage_users', function*() {
        yield authManager.removeRole(this.params.role);
        this.status = 204;
      })
      .put('/roles/:role/', 'duxis/manage_users', function*() {
        const { activities } = this.request.body;
        yield authManager.updateRole(this.params.role, activities);
        this.status = 204;
      })
      /**
       * Update select properties of the given role. The request body should contain one or more of
       * the following properties:
       * - activities {Array.<String>}
       */
      .patch('/roles/:role/', 'duxis/manage_users', function*() {
        yield authManager.updateRole(this.params.role, this.request.body.activities);
        this.status = 204;
      })
      /**
       * Update the activities for the given role.
       */
      .post('/roles/:role/activities/', 'duxis/manage_users', function*() {
        yield authManager.updateRole(this.params.role, this.request.body.activities);
        this.status = 204;
      })
      /**
       * Add activities to the given role.
       */
      .patch('/roles/:role/activities/', 'duxis/manage_users', function*() {
        yield authManager.addRoleActivities(this.params.role, ...this.request.body.activities);
        this.status = 204;
      });
  }

  initUsersApi(router) {
    const authManager = this.authManager;
    router
      .get('/users', 'duxis/view_users', function* () {
        const users = yield authManager.getUsers();
        this.set('X-total-count', users.length);
        this.body = { users };
      })
      .get('/users/:user/',
        function (can) {
          // Authorize users to view their own details, or those with 'duxis/view_users' priviledges:
          return this.state.user.username == this.params.user || can('duxis/view_users');
        },
        function*() {
          //console.log(`GET '/users/${this.params.user}/`);
          const { activities, isRoot, roles, username } = yield authManager.getUser(this.params.user, true);
          this.body = { user: { activities, isRoot, roles, username } };
        })
      .post('/users/:user/', 'duxis/manage_users', function*() {
        const { password, roles, isRoot } = this.request.body;
        yield authManager.addUser(this.params.user, password, roles, isRoot);
        this.status = 204;
      })
      .del('/users/:user/', 'duxis/manage_users', function*() {
        if (this.state.user.username === this.params.user) {
          //log.info('User cannot delete herself.');
          throw new ServerError('User cannot delete herself.', 405);
        }
        yield authManager.removeUser(this.params.user);
        this.status = 204;
      })
      .put('/users/:user/', 'duxis/manage_users', function*() {
        const caller = this.state.user.username;
        if (caller === this.params.user) {
          // TDDO: re-authenticate when user updates herself
        }
        yield authManager.updateUser(this.params.user, this.request.body);
        this.status = 204;
      })
      /**
       * Update select properties of the given user. The request body should contain one or more of
       * the following properties:
       * - password {String}
       * - roles {Array.<String>}
       * - isRoot {boolean}
       */
      .patch('/users/:user/', 'duxis/manage_users', function*() {
        const caller = this.state.user.username;
        if (caller === this.params.user) {
          // TDDO: re-authenticate when user updates herself
        }
        yield authManager.updateUser(this.params.user, this.request.body);
        this.status = 204; // TODO: return updated user object
      })
      /**
       * Update the roles for the given user. The request body should contain the following property:
       * - roles {Array.<String>}
       */
      .post('/users/:user/roles/', 'duxis/manage_users', function*() {
        const caller = this.state.user.username;
        if (caller === this.params.user) {
          // TDDO: re-authenticate when user updates herself
        }
        const { roles } = this.request.body;
        yield authManager.updateUser(this.params.user, { roles });
        this.status = 204; // TODO: return updated user object
      })
      /**
       * Add the given roles to the given user.
       */
      .patch('/users/:user/roles/', 'duxis/manage_users', function*() {
        const caller = this.state.user.username;
        if (caller === this.params.user) {
          // TDDO: re-authenticate when user updates herself
        }
        yield authManager.addUserRole(this.params.user, this.params.role);
        this.status = 204;
      })
      .get('/users/:user/activities/',
        (can) => can('duxis/view_users') || this.state.user.username == this.params.user,
        function* () {
          //console.log(`GET /users/:user/activities/`);
          const activities = yield authManager.userActivities(this.params.user);
          this.body = { activities };
        });
  }

  ///**
  // * Add the auth API.
  // * @private
  // */
  //initAuthSocketAPI() {
  //  const opts = {
  //    route: '/ws/auth',
  //    port: 880
  //  };
  //  this.serveWebSocket(opts, (router) => {
  //    router
  //      .respond('test', (data) => {
  //        log.debug('handling test rpc:', data);
  //        return Promise.resolve('bar');
  //      });
  //  });
  //}

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // onStop handler:

  /** @inheritdoc */
  *onStop() {
    try { yield this.authManager.stop(); } catch (error) {}
  }

}

module.exports = App;
