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

describe('AuthManager - role management', function () {
  let authm, result;

  beforeEach(function* () {
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield authm.reset();
    yield* authm.assertConsistency();
  });

  afterEach(function* () {
    yield* authm.assertConsistency();
    yield authm.reset();
    yield authm.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('authm should have no roles', function* () {
    yield assert.becomes(authm.hasRole('role_1'), false);
    yield assert.isRejected(authm.assertRole('role_1'));
    yield assert.becomes(authm.hasRole('role_2'), false);
    yield assert.isRejected(authm.assertRole('role_2'));
  });

  function* check_role_1(authm) {
    yield assert.isFulfilled(authm.assertRole('role_1'));
    yield assert.becomes(authm.hasRole('role_1'), true);
    assert.deepEqual(yield authm.hasRoles(['role_1']), [true]);
    //log.debug('authm.getRole('role_1'):', yield authm.getRole('role_1'));
    assert.deepEqual(yield authm.getRole('role_1'), {
      name: 'role_1',
      activities: ['act_1', 'act_2'],
      users: []
    });
  }

  function* check_role_2(authm) {
    yield assert.isFulfilled(authm.assertRole('role_2'));
    yield assert.becomes(authm.hasRole('role_2'), true);
    assert.deepEqual(yield authm.hasRoles(['role_2']), [true]);
    //log.debug('authm.getRole('role_2'):', yield authm.getRole('role_2'));
    assert.deepEqual(yield authm.getRole('role_2'), {
      name: 'role_2',
      activities: ['act_2', 'act_3'],
      users: []
    });
  }

  it('add role_1 & role_2', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield* check_role_1(authm);

    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield* check_role_1(authm);
    yield* check_role_2(authm);
  });

  it('reject duplicate role_1', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield assert.isRejected(authm.addRole('role_1', ['act_1']));
  });

  it('stop and re-initialize authm', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield* check_role_1(authm);
    yield* check_role_2(authm);

    yield authm.stop();
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield* check_role_1(authm);
    yield* check_role_2(authm);
  });

  it('update role_1', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.updateRole('role_1', ['act_1', 'act_3']);
    //log.debug('authm.getRole('role_1'):', yield authm.getRole('role_1'));
    assert.deepEqual(yield authm.getRole('role_1'), {
      name: 'role_1',
      activities: ['act_1', 'act_3'],
      users: []
    });
  });

  it('addRoleActivities', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield assert.isFulfilled(authm.addRoleActivities('role_1', 'act_1', 'act_4'));

    //log.debug('authm.getRole('role_1'):', yield authm.getRole('role_1'));
    assert.deepEqual(yield authm.getRole('role_1'), {
      name: 'role_1',
      activities: ['act_1', 'act_2', 'act_4'],
      users: []
    });
  });

  it('get roles', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    assert.deepEqual(yield authm.getRoles().map((role) => role.name), ['role_1']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    assert.deepEqual(yield authm.getRoles().map((role) => role.name), ['role_1', 'role_2']);
  });

  it('removeRole', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    assert.deepEqual(yield authm.getRoles().map((role) => role.name), ['role_1', 'role_2']);

    yield authm.removeRole('role_1', true);
    assert.deepEqual(yield authm.getRoles().map((role) => role.name), ['role_2']);
    yield assert.isRejected(authm.removeRole('role_1', true));

    yield authm.removeRole('role_2', true);
    assert.deepEqual(yield authm.getRoles().map((role) => role.name), []);
  });

});
