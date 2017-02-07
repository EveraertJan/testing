'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const axios = require('axios');
const config = require('cargo-lib/config');
const failStatus = require('cargo-lib/utils/fixtures/failStatus');
const successStatus = require('cargo-lib/utils/fixtures/successStatus');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const AuthApp = require('../../lib/App');
const fixtures = require('../fixtures');

const assert = chai.assert;

const log = log4js.getLogger('authAPI.test');
//process.env.QUIET = 'false'; // show logs for this container

const acnf = fixtures.acnf;
const apiHost = `http://${config.get('soyl.auth.host')}`;

describe('auth API', function () {

  let authApp, root_token, user_token;

  before(function* () {
    this.timeout(5000);
    authApp = yield new AuthApp().start();
  });

  after(function* () {
    yield authApp.authManager.reset();
    yield authApp.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('authenticate root > success', function* () {
    //log.debug(`${apiHost}/auth/authenticate/`);
    const response = yield axios.post(`${apiHost}/auth/authenticate/`, {
      username: 'root',
      password: 'secret'
    });
    const { error, user } = response.data;
    assert.isUndefined(error);
    assert.isObject(user);
    assert.isString(user.token);
    root_token = user.token;
  });

  it('authenticate test_user failure', function* () {
    const response = yield successStatus(200, axios.post(`${apiHost}/auth/authenticate/`, {
      username: 'test_user',
      password: 'random'
    }));
    const { error, user } = response.data;
    assert.isString(error);
    assert.isUndefined(user);
  });

  it('add test_user and roles', function* () {
    const role = {activities: ['test_act_1']};
    yield successStatus(204, axios.post(`${apiHost}/auth/roles/test_role_1/`, role, acnf(root_token)));
    const role_2 = {activities: ['test_act_2', 'test_act_3']};
    yield successStatus(204, axios.post(`${apiHost}/auth/roles/test_role_2/`, role_2, acnf(root_token)));
    const user = {
      isRoot: false,
      password: 'user_secret',
      roles: ['test_role_1']
    };
    yield successStatus(204, axios.post(`${apiHost}/auth/users/test_user_1/`, user, acnf(root_token)));
  });

  it('authenticate test_user', function* () {
    // get token:
    user_token = yield successStatus(200, axios.post(`${apiHost}/auth/authenticate/`, {
      username: 'test_user_1',
      password: 'user_secret'
    })).then((response) => response.data.user.token);
    assert.isString(user_token);
  });

  it('test_user is not authorized to get users', function* () {
    return failStatus(403, axios.get(`${apiHost}/auth/users/`, acnf(user_token)));
  });

  it('test_user is not authorized to get details for other user', function* () {
    return failStatus(403, axios.get(`${apiHost}/auth/users/root/`, acnf(user_token)));
  });

  it('test_user is authorized to get her own details', function* () {
    return successStatus(200, axios.get(`${apiHost}/auth/users/test_user_1/`, acnf(user_token)));
  });

  it('authorize test_user to view users', function* () {
    yield successStatus(204, axios.patch(`${apiHost}/auth/roles/test_role_1/activities/`,
      { activities: [ 'duxis/view_users' ] },
      acnf(root_token))
    );

    // The token is now stale:
    yield failStatus(403, axios.get(`${apiHost}/auth/users/`, acnf(user_token)));

    // Update the token:
    user_token = yield successStatus(200, axios.post(`${apiHost}/auth/authenticate/`, {
      username: 'test_user_1',
      password: 'user_secret'
    })).then((response) => response.data.user.token);

    // Now we can get the users:
    const users = yield successStatus(200, axios.get(`${apiHost}/auth/users/`, acnf(user_token)))
      .then((response) => response.data.users);
    assert.lengthOf(users, 2);
    const usernames = users.map((user) => user.username);
    assert.include(usernames, 'test_user_1');
    assert.include(usernames, 'root');
  });

});
