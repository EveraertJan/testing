'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const CargoApp = require('cargo-lib/CargoApp');
const cargoApi = require('cargo-lib/api/cargoAPI');
const request = require('cargo-lib/api/request');
const cargoManifest = require('cargo-lib/utils/cargoManifest');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const koa = require('koa');
const log4js = require('log4js');

const assert = chai.assert;

const log = log4js.getLogger('api/cargoAPI', log4js.levels.DEBUG);
//process.env.QUIET = 'false'; // show logs for this container

const sidekickManifest = {
  service: 'test-cargo-base-sidekick',
  version: '0.0.1',
  cargoApp: true,
  cargoFrontend: false,
  watchable: false,
  unitTests: { enable: false }
};

describe('api/cargoAPI', function () {

  let app;

  before(function* () {
    app = yield new CargoApp({ disableAuth: true }).start();
  });

  after(function* () {
    yield app.stop();
  });

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  it('should get the own manifest using request', function* () {
    const manifest_0 = yield cargoManifest.read('/cargo');
    //log.debug('manifest_0:', manifest_0);
    const response = yield request.get('http://localhost:8080/cargo/manifest/', { retries: 10 });
    //console.log(response.data);
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, manifest_0);
  });

  it('should get the own manifest using Cargo API', function* () {
    const manifest_0 = yield cargoManifest.read('/cargo');
    //log.debug('manifest_0:', manifest_0);
    let manifest = yield cargoApi.getManifest('localhost');
    assert.deepEqual(manifest, manifest_0);
    manifest = yield cargoApi.getManifest(manifest_0.service);
    assert.deepEqual(manifest, manifest_0);
  });

  it('should get the sidekick manifest using request', function* () {
    const response = yield request.get('http://test-cargo-base-sidekick:8080/cargo/manifest/', { retries: 10 });
    //console.log(response.data);
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, sidekickManifest);
  });

  it('should get the sidekick manifest using using Cargo API', function* () {
    let manifest = yield cargoApi.getManifest('test-cargo-base-sidekick');
    //log.error('manifest:', manifest);
    assert.deepEqual(manifest, sidekickManifest);
  });

});
