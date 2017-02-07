'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const axios = require('axios');
const config = require('cargo-lib/config');
const failStatus = require('cargo-lib/utils/fixtures/failStatus');
const successStatus = require('cargo-lib/utils/fixtures/successStatus');
const chai = require('chai');
const log4js = require('log4js');

const App = require('../../lib/App');
const fixtures = require('../fixtures');

const assert = chai.assert;

const log = log4js.getLogger('userAPI.test');
//process.env.QUIET = 'false'; // show logs for this container

const acnf = fixtures.acnf;
const apiHost = `http://${config.get('soyl.auth.host')}`;

describe('user API', function () {

  let app, admin_token;

  before(function* () {
    this.timeout(5000);
    app = yield new App().start();
    admin_token = yield axios.post(`${apiHost}/auth/authenticate/`, {
      username: 'root',
      password: 'secret'
    }).then((response) => response.data.user.token);
  });

  after(function* () {
    yield app.authManager.reset();
    yield app.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('get root as unknown > not authenticated', function* () {
    return failStatus(401, axios.get(`${apiHost}/auth/users/root/`));
  });

  it('get root as root', function* () {
    const response = yield axios.get(`${apiHost}/auth/users/root/`, acnf(admin_token));
    assert.equal(response.status, 200);
    //log.debug('response.data :', response.data);
    const { isRoot, roles, username } = response.data.user;
    assert.isTrue(isRoot, 'isRoot');
    assert.lengthOf(roles, 0);
    assert.isString(username);
  });

  it('get test_user_1 as root > unknown', function* () {
    return failStatus(404, axios.get(`${apiHost}/auth/users/test_user_1/`, acnf(admin_token)));
  });

  it('root cannot remove herself', function* () {
    return failStatus(405, axios.delete(`${apiHost}/auth/users/root/`, acnf(admin_token)));
  });

  it('root adds test_role_1', function* () {
    const role = {
      activities: ['test_act_1']
    };
    yield successStatus(204, axios.post(`${apiHost}/auth/roles/test_role_1/`, role, acnf(admin_token)));

    // check test_role_1:
    const response = yield axios.get(`${apiHost}/auth/roles/test_role_1/`, acnf(admin_token));
    //log.debug('response.data :', response.data);
    assert.equal(response.status, 200);
    const { activities } = response.data;
    assert.lengthOf(activities, 1);
    assert.include(activities, 'test_act_1');
  });

  it('add test_role_2', function* () {
    const role = {
      activities: ['test_act_2', 'test_act_3']
    };
    yield successStatus(204, axios.post(`${apiHost}/auth/roles/test_role_2/`, role, acnf(admin_token)));

    // check test_role_1:
    const response = yield axios.get(`${apiHost}/auth/roles/test_role_2/`, acnf(admin_token));
    //log.debug('response.data :', response.data);
    assert.equal(response.status, 200);
    const { activities } = response.data;
    assert.lengthOf(activities, 2);
    assert.include(activities, 'test_act_2');
    assert.include(activities, 'test_act_3');
  });

  it('get roles', function* () {
    const response = yield axios.get(`${apiHost}/auth/roles/`, acnf(admin_token));
    //log.debug('response.data :', response.data);
    assert.equal(response.status, 200);
    let { roles } = response.data;
    assert.lengthOf(roles, 5);
    const roleNames = roles.map((role) => role.name);
    assert.include(roleNames, 'test_role_1');
    assert.include(roleNames, 'test_role_2');

    roles = config.get('soyl.auth.defaultRoles');
    for (const { id } of roles) {
      assert.include(roleNames, id);
    }
  });

  it('add test_user_1', function* () {
    const user = {
      isRoot: false,
      password: 'user_secret',
      roles: ['test_role_1']
    };
    yield successStatus(204, axios.post(`${apiHost}/auth/users/test_user_1/`, user, acnf(admin_token)));

    // check test_user_1:
    const response = yield axios.get(`${apiHost}/auth/users/test_user_1/`, acnf(admin_token));
    //log.debug('response.data :', response.data);
    assert.equal(response.status, 200);
    const { isRoot, roles } = response.data.user;
    assert.lengthOf(roles, 1);
    assert.include(roles, 'test_role_1');
    assert.isFalse(isRoot, 'isRoot');
  });

  it('cannot add duplicate user', function* () {
    const user = {
      password: 'user_secret',
      roles: ['test_role_1', 'test_role_2']
    };
    return failStatus(409, axios.post(`${apiHost}/auth/users/test_user_1/`, user, acnf(admin_token)));
  });

  it('update test_user_1', function* () {
    const user = {
      password: 'user_secret_2',
      roles: ['test_role_1', 'test_role_2'],
      isRoot: true
    };
    yield successStatus(204, axios.put(`${apiHost}/auth/users/test_user_1/`, user, acnf(admin_token)));

    // check test_user_1:
    yield successStatus(200, axios.post(`${apiHost}/auth/authenticate/`, {
      username: 'test_user_1',
      password: 'user_secret_2'
    }));
    const response = yield axios.get(`${apiHost}/auth/users/test_user_1/`, acnf(admin_token));
    const { roles, isRoot } = response.data.user;
    assert.lengthOf(roles, 2);
    assert.include(roles, 'test_role_1');
    assert.include(roles, 'test_role_2');
    assert.isTrue(isRoot, 'isRoot');
  });

  it('remove test_user_1', function* () {
    yield successStatus(204, axios.delete(`${apiHost}/auth/users/test_user_1/`, acnf(admin_token)));

    // test_user_1 is gone:
    yield failStatus(404, axios.get(`${apiHost}/auth/users/test_user_1/`, acnf(admin_token)));

    // root still exists:
    const response = yield axios.get(`${apiHost}/auth/users/root/`, acnf(admin_token));
    assert.equal(response.status, 200);
    const { roles, isRoot } = response.data.user;
    assert.lengthOf(roles, 0);
    assert.isTrue(isRoot, 'isRoot');
  });

});
