'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const CargoApp = require('cargo-lib/CargoApp');
const chai = require('chai'); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const log4js = require('log4js');

const assert = chai.assert;

const log = log4js.getLogger('test');
//process.env.QUIET = 'false'; // show logs for this container

const manifestCheck = {
  service: 'test-cargo-base',
  version: '0.0.1',
  cargoApp: true,
  cargoFrontend: false,
  watchable: false,
  unitTests: {
    enable: true,
    service: 'test-cargo-base',
    dependencies: ['test-cargo-base-sidekick']
  }
};

describe('CargoApp', function () {

  it('instantiate with manifest file, start and stop', function (done) {
    const app = new CargoApp({ disableAuth: true });
    assert.deepEqual(app.manifest, manifestCheck);
    app.start()
      .then(() => app.stop())
      .then(() => done());
  });

  it('instantiate with manifest object, start and stop', function (done) {
    const app = new CargoApp({ disableAuth: true, manifestCheck });
    assert.deepEqual(app.manifest, manifestCheck);
    app.start()
      .then(() => app.stop())
      .then(() => done());
  });

});
