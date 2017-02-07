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

describe('AuthManager - activities', function () {
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

  it('registerActivities', function* () {
    yield authm.registerActivities(['act_1', 'act_2']);
    yield* authm.assertConsistency();
    const aim = authm.activityIndexMap();
    assert.lengthOf(Object.keys(aim), 2);
    assert.include(Object.keys(aim), 'act_1');
    assert.include(Object.keys(aim), 'act_2');
  });

  it('removeActivities', function* () {
    assert.equal(authm._nextIndex, 0);
    assert.deepEqual(authm.activityIndexMap(), {});

    yield authm.registerActivities(['act_1', 'act_2', 'act_3']);
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {
      act_1: 0,
      act_2: 1,
      act_3: 2
    });
    assert.equal(authm._nextIndex, 3);

    yield authm.removeActivities('act_2');
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {
      act_1: 0,
      act_3: 2
    });
    assert.equal(authm._nextIndex, 3);

    yield authm.removeActivities('act_3');
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {
      act_1: 0
    });
    assert.equal(authm._nextIndex, 3);

    yield authm.removeActivities('act_1');
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {});
    assert.equal(authm._nextIndex, 3);
  });

  it('persist activity indices', function* () {
    yield authm.registerActivities(['act_1', 'act_2']);
    const aim = authm.activityIndexMap();

    yield authm.stop();
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield* authm.assertConsistency();
    assert.deepEqual(aim, authm.activityIndexMap());
  });

  it('register activities when using addRole', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {
      act_1: 0,
      act_2: 1
    });
  });

  it('register activities when using updateRole', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.updateRole('role_1', ['act_2', 'act_3']);
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {
      act_1: 0,
      act_2: 1,
      act_3: 2
    });
  });

  it('register activities when using addRoleActivities', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRoleActivities('role_1', 'act_2', 'act_3');
    yield* authm.assertConsistency();
    assert.deepEqual(authm.activityIndexMap(), {
      act_1: 0,
      act_2: 1,
      act_3: 2
    });
  });

  it('userActivities', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1', ['role_1']);
    yield authm.addUser('user_2', 'secret_2', ['role_2']);
    yield authm.addUser('user_3', 'secret_3', ['role_1', 'role_2']);

    let activities;
    activities = yield authm.userActivities('user_1');
    assert.deepEqual(activities, ['act_1', 'act_2']);
    activities = yield authm.userActivities('user_2');
    assert.deepEqual(activities, ['act_2', 'act_3']);
    activities = yield authm.userActivities('user_3');
    assert.deepEqual(activities, ['act_1', 'act_2', 'act_3']);
  });

  it('userActivitiesBitmap 1', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1', ['role_1']);
    yield* authm.assertConsistency();
    const aim = authm.activityIndexMap();
    const abm = yield* authm._userActivitiesBitmap('user_1');
    assert.isTrue(abm.has(aim['act_1']));
    assert.isTrue(abm.has(aim['act_2']));
    assert.isFalse(abm.has(aim['act_3']));
  });

  it('userActivitiesBitmap 2', function* () {
    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);
    yield* authm.assertConsistency();
    const aim = authm.activityIndexMap();
    const abm = yield* authm._userActivitiesBitmap('user_1');
    assert.isTrue(abm.has(aim['act_1']));
    assert.isTrue(abm.has(aim['act_2']));
    assert.isTrue(abm.has(aim['act_3']));
  });

  it('restart auth-manager', function* () {
    function* check() {
      assert.deepEqual(authm.activityIndexMap(), {
        act_1: 0,
        act_2: 1,
        act_3: 2
      });
      let activities = yield authm.userActivities('user_1');
      assert.deepEqual(activities, ['act_1', 'act_2', 'act_3']);
    }

    yield authm.addRole('role_1', ['act_1', 'act_2']);
    yield authm.addRole('role_2', ['act_2', 'act_3']);
    yield authm.addUser('user_1', 'secret_1', ['role_1', 'role_2']);
    yield* authm.assertConsistency();
    yield* check();

    yield authm.stop();
    authm = new AuthManager();
    yield authm.initialize(fixtures.authManagerOpts);
    yield* authm.assertConsistency();
    yield* check();
  });

});
