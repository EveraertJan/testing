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

describe('AuthManager - user management', function () {
  let authm;

  beforeEach(function* () {
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield authm.reset();
    yield* authm.assertConsistency();
  });

  afterEach(function* () {
    yield authm.reset();
    yield authm.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function* addUsers(authm) {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);
    yield authm.addUser('user_2', 'secret_2', [], true);
  }

  function* checkUsers(authm) {
    let user;

    yield assert.becomes(authm.hasUser('user_1'), true);
    yield assert.isFulfilled(authm.assertUser('user_1'));
    user = yield authm.getUser('user_1', true);
    assert.isObject(user);
    assert.deepEqual(user.roles, ['role_1', 'role_2']);
    assert.deepEqual(user.activities, ['act_1', 'act_2', 'act_3']);
    assert.isFalse(user.isRoot, 'isRoot');
    yield assert.becomes(authm.isRoot('user_1'), false);
    yield assert.isFulfilled(authm.authenticate('user_1', 'secret_1'));

    yield assert.becomes(authm.hasUser('user_2'), true);
    yield assert.isFulfilled(authm.assertUser('user_2'));
    user = yield authm.getUser('user_2');
    //log.debug('user_2:', user);
    assert.isObject(user);
    assert.deepEqual(user.roles, []);
    assert.isTrue(user.isRoot, 'isRoot');
    yield assert.becomes(authm.isRoot('user_2'), true);
    yield assert.isFulfilled(authm.authenticate('user_2', 'secret_2'));
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('authm should have no users', function* () {
    yield assert.becomes(authm.hasUser('user_1'), false);
    yield assert.isRejected(authm.assertUser('user_1'));
    yield assert.becomes(authm.hasUser('user_2'), false);
    yield assert.isRejected(authm.assertUser('user_2'));
  });

  it('adding user with unknown role should fail', function* () {
    yield assert.isRejected(authm.addUser('user_1', 'secret_1',
      ['role_1', 'role_2'], false));
  });

  it('add roles & users', function* () {
    yield* addUsers(authm);
    yield* authm.assertConsistency();
    yield* checkUsers(authm);
  });

  it('reject duplicate user', function* () {
    yield* addUsers(authm);
    yield assert.isRejected(authm.addUser('user_1', 'secret_1'));
    yield assert.isRejected(authm.addUser('user_2', 'secret_1'));
  });

  it('restart authm & check all', function* () {
    yield* addUsers(authm);
    yield authm.stop();
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield* checkUsers(authm);
  });

  it('updateUser', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2']);
    yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);

    yield authm.updateUser('user_1', {
      password: 'secret_3',
      roles: ['role_2'],
      isRoot: true
    });
    yield* authm.assertConsistency();

    let user = yield authm.getUser('user_1');
    //log.debug('user_1:', user);
    assert.isObject(user);
    assert.lengthOf(user.roles, 1);
    assert.deepEqual(user.roles, [ 'role_2' ]);
    assert.isTrue(user.isRoot, 'isRoot');
    yield assert.becomes(authm.isRoot('user_1'), true);
    yield assert.isFulfilled(authm.authenticate('user_1', 'secret_3'));
  });

  it('get users', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2']);
    yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);
    yield authm.addUser('user_2', 'secret_2', [], true);

    const users = yield authm.getUsers();
    //log.debug('usernames:', usernames);
    const usernames = users.map((user) => user.username);
    assert.deepEqual(usernames, ['user_1', 'user_2']);
  });

  it('removeUser', function* () {
    yield* addUsers(authm);
    let users, usernames;
    yield* authm.assertConsistency();

    yield authm.removeUser('user_2', true);
    yield* authm.assertConsistency();
    users = yield authm.getUsers();
    usernames = users.map((user) => user.username);
    assert.deepEqual(usernames, ['user_1']);
    yield assert.isRejected(authm.removeUser('user_2', true));

    yield authm.removeUser('user_1', true);
    yield* authm.assertConsistency();
    users = yield authm.getUsers();
    usernames = users.map((user) => user.username);
    assert.deepEqual(usernames, []);
    yield assert.isRejected(authm.removeUser('user_1', true));
  });

});
