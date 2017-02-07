'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const AuthManager = require('../../lib/AuthManager');
const fixtures = require('../fixtures');

const assert = chai.assert;

const log = log4js.getLogger('AuthManager.test');
//process.env.QUIET = 'false'; // show logs for this container

describe('AuthManager - auth functionality', function () {
  let authm;

  beforeEach(function* () {
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
  });

  afterEach(function* () {
    yield authm.reset();
    yield authm.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  describe('authenticate', function () {

    it('success', function* () {
      yield authm.addRole('role_1', ['act_1', 'act_2']);
      yield authm.addRole('role_2', ['act_2', 'act_3']);
      yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);
      const user = yield assert.isFulfilled(authm.authenticate('user_1', 'secret_1'));
      //log.debug('user:', user);
      assert.isObject(user);
      assert.deepEqual(user.roles, ['role_1', 'role_2']);
      assert.deepEqual(user.activities, ['act_1', 'act_2', 'act_3']);
      assert.isFalse(user.isRoot, 'isRoot');
    });

    it('failure', function* () {
      yield authm.addRole('role_1', ['act_1', 'act_2']);
      yield authm.addUser('user_1', 'secret_1', ['role_1'], false);
      yield assert.isRejected(authm.authenticate('user_1', 'random'));
    });

  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  describe('authorize', function () {

    it('authorize user_1', function* () {
      yield authm.registerActivities(['act_1', 'act_2', 'act_3']);
      yield authm.addRole('role_1', ['act_1', 'act_2']);
      yield authm.addRole('role_2', ['act_2', 'act_3']);
      yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2'], false);
      yield* authm.assertConsistency();

      const token = yield authm.getToken('user_1');
      assert.isString(token);
      //log.debug(token);

      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_1')), true);
      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_2')), true);
      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_3')), true);
      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_4')), false);
    });

    it('authorize root user', function* () {
      yield authm.addUser('user_1', 'secret_1', null, true);

      const token = yield authm.getToken('user_1');
      assert.isString(token);
      //log.debug(token);

      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_1')), true);
      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_2')), true);
      yield assert.becomes(authm.authorize(token, authm.activityIndex('act_3')), true);
    });

  });

});
