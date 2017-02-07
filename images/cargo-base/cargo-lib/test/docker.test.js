'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Docker = require('cargo-lib/docker/Docker');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const assert = chai.assert;
const log = log4js.getLogger('cargo-lib/docker/Docker tests');

const docker = new Docker();

describe('docker/Docker', function () {
  this.timeout(5000);

  it('container.exists', function* () {
    const name = 'test-container';
    let container = docker.getContainer(name);
    yield container.removeAsync().catch(() => null); // cleanup
    yield assert.becomes(container.existsAsync(), false);

    container = yield docker.createContainerAsync({
      Image: 'node:7.0.0',
      Labels: { 'traefik.enable': 'false' },
      name: name
    });
    yield assert.becomes(container.existsAsync(), true);
    container = docker.getContainer(name);
    yield assert.becomes(container.existsAsync(), true);

    yield container.removeAsync().catch(() => null); // cleanup
    yield assert.becomes(container.existsAsync(), false);
  });

  it('network.exists', function* () {
    const name = 'test-network';
    let network = docker.getNetwork(name);
    yield network.removeAsync().catch(() => null); // cleanup
    yield assert.becomes(network.existsAsync(), false);

    network = yield docker.createNetworkAsync({ Name: name });
    yield assert.becomes(network.existsAsync(), true);
    network = docker.getNetwork(name);
    yield assert.becomes(network.existsAsync(), true);

    yield network.removeAsync().catch(() => null); // cleanup
    yield assert.becomes(network.existsAsync(), false);
  });

  it.skip('image.exists', function* () {
    const name = 'main';
    let image = docker.getImage(name);
    yield image.removeAsync().catch(() => null); // cleanup
    yield assert.becomes(image.existsAsync(), false);

    //image = yield docker.createImageAsync({ Name: name });

    //yield assert.isFulfilled(removeContainer(docker, name));
    //yield assert.becomes(containerExists(docker, name), false);
    //yield docker.getContainer(name).removeAsync().catch(() => null); // cleanup
  });

  it('should get the container for a service', function* () {
    const serviceName = 'test-cargo-base';
    let result = yield docker.getContainerForService(serviceName);
    //log.debug(result);
    assert.isObject(result);
    assert.equal(result.Labels['com.docker.compose.service'], serviceName);
    assert.equal(result.Labels['com.docker.compose.project'], process.env.DC_PROJECT);
  });

});
