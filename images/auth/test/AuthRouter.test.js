'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const AuthRouter = require('cargo-lib/api/AuthRouter');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const AuthApp = require('../lib/App');
const AuthManager = require('../lib/AuthManager');

const fixtures = require('./fixtures');

const assert = chai.assert;

const log = log4js.getLogger('AuthRouter.test');
//process.env.QUIET = 'false'; // show logs for this container

describe('cargo-lib/api/AuthRouter', function () {

  it('register activities - local authManager', function* () {
    const authManager = new AuthManager();
    yield authManager.initialize(fixtures.authManagerOpts);

    const authRouter = new AuthRouter({ authManager });
    authRouter._toRegister.add('test_act_1').add('test_act_2');
    yield authRouter.registerActivities();

    let aim = authRouter._actIdxMap;
    assert.isDefined(aim['test_act_1']);
    assert.isDefined(aim['test_act_2']);
    assert.isUndefined(aim['test_act_3']);

    aim = authManager.activityIndexMap();
    assert.isDefined(aim['test_act_1']);
    assert.isDefined(aim['test_act_2']);
    assert.isUndefined(aim['test_act_3']);

    yield authManager.reset();
    yield authManager.stop();
  });

  it('register activities - remote authManager', function* () {
    const authApp = yield new AuthApp().start();
    const authManager = authApp.authManager;

    const authRouter = new AuthRouter();
    authRouter._toRegister.add('test_act_1').add('test_act_2');
    yield authRouter.registerActivities();

    let aim = authRouter._actIdxMap;
    assert.isDefined(aim['test_act_1']);
    assert.isDefined(aim['test_act_2']);
    assert.isUndefined(aim['test_act_3']);

    aim = authManager.activityIndexMap();
    assert.isDefined(aim['test_act_1']);
    assert.isDefined(aim['test_act_2']);
    assert.isUndefined(aim['test_act_3']);

    yield authApp.authManager.reset();
    yield authApp.stop();
  });

  it('authorize root', function* () {
    const authApp = yield new AuthApp().start();
    const authManager = authApp.authManager;

    const authRouter = new AuthRouter({ authManager });
    assert.isFulfilled(authRouter.authorize({ isRoot: true }, null));

    yield authApp.authManager.reset();
    yield authApp.stop();
  });

  it('authorize activities', function* () {
    const authManager = new AuthManager();
    yield authManager.initialize(fixtures.authManagerOpts);
    yield authManager.addRole('test_role_1', ['test_act_1', 'test_act_2']);
    yield authManager.addUser('test_user_1', 'user_secret', ['test_role_1'], false);

    const authRouter = new AuthRouter({ authManager });
    authRouter._toRegister.add('test_act_1').add('test_act_2');
    yield authRouter.registerActivities();

    const abm = yield* authManager._userActivitiesBitmap('test_user_1');
    const user = { abm: abm.toString() };
    assert.isFulfilled(authRouter.authorize(user, 'test_act_1'));
    assert.isFulfilled(authRouter.authorize(user, 'test_act_2'));
    assert.isFulfilled(authRouter.authorize(user, 'test_act_1', 'test_act_2'));
    assert.isRejected(authRouter.authorize(user, 'test_act_3'));

    yield authManager.reset();
    yield authManager.stop();
  });

  it('authorize function => true/false', function* () {
    const authManager = new AuthManager();
    yield authManager.initialize(fixtures.authManagerOpts);
    yield authManager.addRole('test_role_1', ['test_act_1', 'test_act_2']);
    yield authManager.addUser('test_user_1', 'user_secret', ['test_role_1'], false);

    const authRouter = new AuthRouter({ authManager });
    authRouter._toRegister.add('test_act_1').add('test_act_2');
    yield authRouter.registerActivities();

    const abm = yield* authManager._userActivitiesBitmap('test_user_1');
    const user = { abm: abm.toString() };
    assert.isFulfilled(authRouter.authorize(user, () => true));
    assert.isRejected(authRouter.authorize(user, () => false));
    assert.isFulfilled(authRouter.authorize(user, function (can) {
      assert.isTrue(can('test_act_1'));
      assert.isTrue(can('test_act_2'));
      assert.isTrue(can('test_act_1', 'test_act_2'));
      assert.isTrue(can('test_act_1', 'test_act_3'));
      assert.isFalse(can('test_act_4', 'test_act_3'));
      return true;
    }));

    yield authManager.reset();
    yield authManager.stop();
  });

  it('authorize function => promise', function* () {
    const authManager = new AuthManager();
    yield authManager.initialize(fixtures.authManagerOpts);
    yield authManager.addRole('test_role_1', ['test_act_1', 'test_act_2']);
    yield authManager.addUser('test_user_1', 'user_secret', ['test_role_1'], false);

    const authRouter = new AuthRouter({ authManager });
    authRouter._toRegister.add('test_act_1').add('test_act_2');
    yield authRouter.registerActivities();

    const abm = yield* authManager._userActivitiesBitmap('test_user_1');
    const user = { abm: abm.toString() };
    assert.isFulfilled(authRouter.authorize(user, () => true));
    assert.isRejected(authRouter.authorize(user, () => false));
    assert.isFulfilled(authRouter.authorize(user, function (can) {
      assert.isTrue(can('test_act_1'));
      assert.isTrue(can('test_act_2'));
      assert.isTrue(can('test_act_1', 'test_act_2'));
      assert.isTrue(can('test_act_1', 'test_act_3'));
      assert.isFalse(can('test_act_4', 'test_act_3'));
      return true;
    }));

    yield authManager.reset();
    yield authManager.stop();
  });

});
