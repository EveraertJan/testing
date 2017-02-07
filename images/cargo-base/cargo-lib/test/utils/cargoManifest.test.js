'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const resolve = require('path').resolve;

const cargoManifest = require('cargo-lib/utils/cargoManifest');
const chai = require("chai"); // chai-as-promised, chai-http & co-mocha are loaded by rootHooks.js
const _ = require('lodash');
const log4js = require('log4js');

const assert = chai.assert;

const log = log4js.getLogger('cargoManifest.test');

describe('utils/cargoManifest', function () {

  describe('read', function () {

    it('reads manifest', function () {
      return assert.becomes(cargoManifest.read(resolve(__dirname,
        'fixtures/cargoManifest/t1')),
        {
          service: 'cargo-base-test',
          version: '0.0.1',
          cargoApp: true,
          cargoFrontend: true,
          watchable: true,
          dependencies: [
            'some-service',
            'another-service'
          ],
          unitTests: {
            enable: true,
            service: 'test-cargo-base-test',
            dependencies: [
              'test-some-service',
              'test-another-service'
            ]
          }
        });
    });

    it('rejects incorrect manifest', function () {
      return assert.isRejected(cargoManifest.read(resolve(__dirname,
        'fixtures/cargoManifest/t2')));
    });

    it('rejects void directory', function () {
      return assert.isRejected(cargoManifest.read(resolve(__dirname,
        'fixtures/cargoManifest/void')));
    });

    it('rejects missing manifest', function () {
      return assert.isRejected(cargoManifest.read(resolve(__dirname,
        'fixtures/cargoManifest')));
    });

  }); // END: read

});
