'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const config = require('cargo-lib/config');
//const _ = require('lodash');

const Docker = require('./Docker');

const docker = new Docker();

const testAuthService = config.get('soyl.auth.host');
const testStoreService = config.get('soyl.auth.storeHost');
const networkName = `${process.env.DC_PROJECT}_soyl-auth`;

/**
 * Retained here as an example of how to create a Docker network and a container.
 */
function upAuthContainer() {
  return Promise.coroutine(function* () {
    let exists = yield docker.getNetwork(networkName).existsAsync();
    if (!exists) { yield docker.createNetworkAsync({ Name: networkName }); }

    let container = docker.getContainer(testAuthService);
    exists = yield container.existsAsync();
    if (!exists) {
      container = yield docker.createContainerAsync({
        HostConfig: {
          binds: [

          ]
        },
        Image: `${process.env.DC_PROJECT}_soyl-auth`,
        Labels: { 'traefik.enable': 'false' },
        name: testStoreService,
        NetworkingConfig: {
          EndpointsConfig: {
            [networkName] : {}
          }
        },
        Tty: false,
        Volumes: { '/data': {} }
      });
    }

    // Show container logs:
    //container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
    //  container.modem.demuxStream(stream, process.stdout, process.stderr);
    //});

    // Start the container:
    let data = yield container.inspectAsync();
    if (!data.State.Running) { yield container.startAsync(); }

    // Wait for the container to be up and running...
    yield Promise.delay(2000);
  })();
}

/**
 * Retained here as an example of how to create a Docker network and a container.
 */
function upAuthStoreTestContainer() {
  return Promise.coroutine(function* () {
    let exists = yield docker.getNetwork(networkName).existsAsync();
    if (!exists) { yield docker.createNetworkAsync({ Name: networkName }); }

    let container = docker.getContainer(testStoreService);
    exists = yield container.existsAsync();
    if (!exists) {
      container = yield docker.createContainerAsync({
        Image: `${process.env.DC_PROJECT}_soyl-auth-store`,
        Labels: { 'traefik.enable': 'false' },
        name: testStoreService,
        NetworkingConfig: {
          EndpointsConfig: {
            [networkName] : {}
          }
        },
        Tty: false,
        Volumes: { '/data': {} }
      });
    }

    // Show container logs:
    //container.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
    //  container.modem.demuxStream(stream, process.stdout, process.stderr);
    //});

    // Start the container:
    let data = yield container.inspectAsync();
    if (!data.State.Running) { yield container.startAsync(); }

    // Wait for the container to be up and running...
    yield Promise.delay(2000);
  })();
}

/**
 * Retained here as an example of how to stop a container.
 */
function downAuthStoreTestContainer() {
  return Promise.coroutine(function* () {
    //console.log('Stopping test-soyl-auth-store container...');
    const container = docker.getContainer(testStoreService);
    yield container.stopAsync();
    yield container.removeAsync();
  })();
}

