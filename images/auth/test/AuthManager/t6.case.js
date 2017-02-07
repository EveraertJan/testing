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

describe('AuthManager - t6.case', function () {
  let authm;

  beforeEach(function* () {
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield authm.reset();
  });

  afterEach(function* () {
    yield authm.reset();
    yield authm.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function* case_1_aux(authm) {
    // Add the default roles:
    let exists = yield authm.hasRole('duxis/admin');
    if (!exists) {
      yield authm.addRole('duxis/admin', ['duxis/view_users', 'duxis/manage_users']);
    }
    else {
      yield authm.updateRole('duxis/admin', ['duxis/view_users', 'duxis/manage_users']);
    }

    // Add the admin user:
    exists = yield authm.hasUser('admin');
    if (!exists) {
      yield authm.addUser('admin', 'admin', ['duxis/admin']);
    }
    else {
      yield authm.updateUser('admin', { roles: ['duxis/admin'] });
    }

    // Add the guest user:
    exists = yield authm.hasUser('guest');
    if (!exists) {
      yield authm.addUser('guest', 'guest');
    }

    // Add the default PanelKit2 roles:
    exists = yield authm.hasRole('test/admin');
    if (!exists) {
      yield authm.addRole('test/admin', ['test/view_data', 'test/manage_data']);
    }
    else {
      yield authm.updateRole('test/admin', ['test/view_data', 'test/manage_data']);
    }
    // ..
    exists = yield authm.hasRole('test/guest');
    if (!exists) {
      yield authm.addRole('test/guest', ['test/view_data']);
    }
    else {
      yield authm.updateRole('test/guest', ['test/view_data']);
    }

    // Add `test/admin` role to `admin` user:
    yield authm.addUserRole('admin', 'test/admin');
    // Add `test/guest` role to `guest` user:
    yield authm.addUserRole('guest', 'test/guest');
  }

  function* checkState(authm) {
    let abm, activities;
    yield* authm.assertConsistency();
    //log.debug('authm.activityIndexMap():', authm.activityIndexMap());
    assert.deepEqual(authm.activityIndexMap(), {
      'duxis/view_users': 0,
      'duxis/manage_users': 1,
      'test/view_data': 2,
      'test/manage_data': 3
    });

    activities = yield authm.userActivities('admin');
    assert.deepEqual(activities, ['duxis/view_users', 'duxis/manage_users', 'test/view_data', 'test/manage_data']);
    abm = yield* authm._userActivitiesBitmap('admin');
    assert.isTrue(abm.has(0));
    assert.isTrue(abm.has(1));
    assert.isTrue(abm.has(2));
    assert.isTrue(abm.has(3));

    activities = yield authm.userActivities('guest');
    assert.deepEqual(activities, ['test/view_data']);
    abm = yield* authm._userActivitiesBitmap('guest');
    assert.isFalse(abm.has(0));
    assert.isFalse(abm.has(1));
    assert.isTrue(abm.has(2));
    assert.isFalse(abm.has(3));
  }

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('add or update admin and guest users', function* () {
    yield* case_1_aux(authm);
    yield* checkState(authm);

    yield authm.stop();
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);

    yield* checkState(authm);
    yield* case_1_aux(authm);
    yield* checkState(authm);
  });

});
