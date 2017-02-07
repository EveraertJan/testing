'use strict';

/**
 * This module is included in each Mocha test of a Cargo container (in the startup.sh script).
 * This module adds a root-level after-hook that stop all dependant test services.
 *
 * @todo Stop dependant services recursively. Make sure that for each case in which two services
 *       depend on a third, this third service is terminated first.
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const cargoApi = require('cargo-lib/api/cargoAPI');
const Docker = require('cargo-lib/docker/Docker');
const chai = require("chai");
chai.use(require("chai-as-promised"));
chai.use(require('chai-http'));
require('co-mocha');

const readCargoManifest = require('../cargoManifest').read;

console.log('Loading root hooks...');

after(function* () {
  //console.log('After root hook...');
  this.timeout(10000);

  const manifest = yield readCargoManifest('/cargo');
  if (manifest.unitTests && manifest.unitTests.enable && manifest.unitTests.dependencies) {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    for (const service of manifest.unitTests.dependencies) {
      const depManifest = yield cargoApi.getManifest(service);//.catch(() => null);
      //console.log('depManifest:', depManifest);
      if (depManifest) {
        console.log(`Stopping '${service}' using Cargo API...`);
        yield cargoApi.stopService(service)
          .catch(() => null);
      }
      else {
        console.log(`Stopping '${service}' using Docker API...`);
        yield docker.getContainer(`${process.env.DC_PROJECT}_${service}_1`)
          .stopAsync()
          .catch(() => null);
      }
    }
  }
});
