'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const config = require('cargo-lib/config');
const request = require('cargo-lib/api/request');
const failStatus = require('cargo-lib/utils/fixtures/failStatus');
const successStatus = require('cargo-lib/utils/fixtures/successStatus');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
require('co-mocha');
const log4js = require('log4js');

const App = require('../lib/App');
//const fixtures = require('../fixtures');

const assert = chai.assert;
chai.use(chaiAsPromised);

const log = log4js.getLogger('Api.test');
process.env.QUIET = 'false'; // show logs for this container

const apiHost = `${config.get('fogg.hosts.api')}`;

const Docker = require('cargo-lib/docker/Docker');
const docker = new Docker();

const requestOpts = {
  retries: 10
}

describe('API', function () {

  let app;

  before(function* () {
    this.timeout(10000);
    app = yield new App({ disableAuth: true }).start();
  });

  after(function* () {
    yield app.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('should initially have zero rewards', function* () {
    //yield request.del(`${apiHost}/rewards/`, requestOpts);
    yield request.del(`${apiHost}/rewards/reward_1/`, requestOpts);

    //assert.isArray(app.rewardEngine._rewards);
    //assert.lengthOf(app.rewardEngine._rewards, 0);
    //assert.equal(app.rewardEngine._rewardsMap.size, 0);

    const rewards = yield request.get(`${apiHost}/rewards/`)
      .then((response) => response.data.rewards);
    log.debug('rewards:', rewards);
    assert.isArray(rewards);
    assert.lengthOf(rewards, 0);
  });

  it('should add a reward', function* () {
    const reward_0 = {
      id: 'reward_1',
      type: 'type_1',
      value: 123,
      label: 'Reward 1'
    };
    yield request.post(`${apiHost}/rewards/`, reward_0);

    assert.lengthOf(app.rewardEngine._rewards, 1);
    assert.equal(app.rewardEngine._rewardsMap.size, 1);

    const rewards = yield request.get(`${apiHost}/rewards/`)
      .then((response) => response.data.rewards);

    log.debug('rewards:', rewards);
    assert.isArray(rewards);
    assert.lengthOf(rewards, 1);
    const reward = rewards[0];
    assert.equal(reward_0.id, reward.id);
    assert.equal(reward_0.type, reward.type);
    assert.equal(reward_0.value, reward.value);
    assert.equal(reward_0.label, reward.label);
  });

});
