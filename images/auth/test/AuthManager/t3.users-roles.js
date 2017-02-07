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

describe('AuthManager - users & roles', function () {
  //this.timeout(5000);
  let authm, role, user;

  beforeEach(function* () {
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
  });

  afterEach(function* () {
    yield authm.reset();
    yield authm.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('add user with roles', function* () {
    yield authm.addRole('role_1');
    yield authm.addRole('role_2');
    yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);
    yield* authm.assertConsistency();

    role = yield assert.isFulfilled(authm.getRole('role_1'));
    //log.debug('role_1:', role);
    assert.isArray(role.users);
    assert.lengthOf(role.users, 1);
    assert.include(role.users, 'user_1');

    role = yield assert.isFulfilled(authm.getRole('role_2'));
    //log.debug('role_2:', role);
    assert.isArray(role.users);
    assert.lengthOf(role.users, 1);
    assert.include(role.users, 'user_1');
  });

  function* assertRoleUsers(users_1, users_2, context) {
    role = yield authm.getRole('role_1');
    assert.deepEqual(role.users, users_1, `unexpected users for role_1 ${context}`);
    role = yield authm.getRole('role_2');
    assert.deepEqual(role.users, users_2, `unexpected users for role_2 ${context}`);
  }

  function* assertUserRoles(roles_1, roles_2, context) {
    user = yield authm.getUser('user_1');
    assert.deepEqual(user.roles, roles_1, `unexpected roles for user_1 ${context}`);
    user = yield authm.getUser('user_2');
    assert.deepEqual(user.roles, roles_2, `unexpected roles for user_2 ${context}`);
  }

  function* assertUserActivities(acts_1, acts_2, context) {
    assert.deepEqual(yield authm.userActivities('user_1'), acts_1,
      `unexpected activities for user_1 ${context}`);
    assert.deepEqual(yield authm.userActivities('user_2'), acts_2,
      `unexpected activities for user_2 ${context}`);
  }

  it('addUserRole', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1');
    yield authm.addUser('user_2', 'secret_2');
    yield* authm.assertConsistency();
    yield* assertRoleUsers([], [], 'in base case');
    yield* assertUserRoles([], [], 'in base case');
    yield* assertUserActivities([], [], 'in base case');

    // Add 'role_1' > 'user_1'
    yield authm.addUserRole('user_1', 'role_1');
    yield* authm.assertConsistency();
    yield* assertRoleUsers(['user_1'], []);
    yield* assertUserRoles(['role_1'], []);
    yield* assertUserActivities(['act_1', 'act_2'], []);

    // Add 'role_2' > 'user_2'
    yield authm.addUserRole('user_2', 'role_2');
    yield* authm.assertConsistency();
    yield* assertRoleUsers(['user_1'], ['user_2']);
    yield* assertUserRoles(['role_1'], ['role_2']);
    yield* assertUserActivities(['act_1', 'act_2'], ['act_2', 'act_3']);

    // Add 'role_2' > 'user_1'
    yield authm.addUserRole('user_1', 'role_2');
    yield* authm.assertConsistency();
    yield* assertRoleUsers(['user_1'], ['user_2', 'user_1']);
    yield* assertUserRoles(['role_1', 'role_2'], ['role_2']);
    yield* assertUserActivities(['act_1', 'act_2', 'act_3'], ['act_2', 'act_3']);
  });

  it('removeUserRole', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1');
    yield authm.addUser('user_2', 'secret_2');
    yield authm.addUserRole('user_1', 'role_1');
    yield authm.addUserRole('user_2', 'role_2');
    yield authm.addUserRole('user_1', 'role_2');
    yield* authm.assertConsistency();
    yield* assertRoleUsers(['user_1'], ['user_2', 'user_1'], 'in base base');
    yield* assertUserRoles(['role_1', 'role_2'], ['role_2'], 'in base base');
    yield* assertUserActivities(['act_1', 'act_2', 'act_3'], ['act_2', 'act_3'], 'in base base');

    // Remove 'role_1' from 'user_1':
    yield authm.removeUserRole('user_1', 'role_1');
    yield* authm.assertConsistency();
    yield* assertRoleUsers([], ['user_2', 'user_1'], 'after first removal');
    yield* assertUserRoles(['role_2'], ['role_2'], 'after first removal');
    yield* assertUserActivities(['act_2', 'act_3'], ['act_2', 'act_3'], 'after first removal');

    // Remove 'role_2' from 'user_2':
    yield authm.removeUserRole('user_2', 'role_2');
    yield* authm.assertConsistency();
    yield* assertRoleUsers([], ['user_1'], 'after second removal');
    yield* assertUserRoles(['role_2'], [], 'after second removal');
    yield* assertUserActivities(['act_2', 'act_3'], [], 'after second removal');

    // Remove 'role_2' from 'user_1':
    yield authm.removeUserRole('user_1', 'role_2');
    yield* authm.assertConsistency();
    yield* assertRoleUsers([], [], 'after third removal');
    yield* assertUserRoles([], [], 'after third removal');
    yield* assertUserActivities([], [], 'after third removal');
  });

  it('update user roles', function* () {
    yield authm.addRole('role_1');
    yield authm.addRole('role_2');
    yield authm.addUser('user_1', 'secret_1', ['role_1']);
    yield* authm.assertConsistency();

    // Update with unknown role should fail:
    yield assert.isRejected(authm.updateUser('user_1', { roles: ['role_3'] }));
    yield* authm.assertConsistency();

    yield authm.updateUser('user_1', { roles: ['role_2'] });
    yield* authm.assertConsistency();

    role = yield authm.getRole('role_1');
    assert.lengthOf(role.users, 0);

    role = yield authm.getRole('role_2');
    assert.lengthOf(role.users, 1);
    assert.include(role.users, 'user_1');

    user = yield authm.getUser('user_1');
    assert.lengthOf(user.roles, 1);
    assert.include(user.roles, 'role_2');

    yield authm.updateUser('user_1', { roles: ['role_1', 'role_2'] });
    yield* authm.assertConsistency();

    role = yield authm.getRole('role_1');
    assert.lengthOf(role.users, 1);
    assert.include(role.users, 'user_1');

    role = yield authm.getRole('role_2');
    assert.lengthOf(role.users, 1);
    assert.include(role.users, 'user_1');

    user = yield authm.getUser('user_1');
    assert.lengthOf(user.roles, 2);
    assert.include(user.roles, 'role_1');
    assert.include(user.roles, 'role_2');
  });

});
