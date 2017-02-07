'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Docker = require('cargo-lib/docker/Docker');
const log4js = require('log4js');
const ftpromise = require('retrying-promise');

const request = require('./request');

const log = log4js.getLogger('cargoAPI');

/**
 * Initializes the CargoAPI for the given Cargo app.
 * @param {CargoApp} app
 */
function initCargoApi(app) {
  log.info('Mounting Cargo API...');
  app.serveSecureApi({ authManager: app.authManager, port: 8080 }, (router) => router
    .get('/cargo/manifest/', function* () {
      //console.log('GET /cargo/manifest/ >', app.manifest);
      this.body = app.manifest;
    })
    .get('/cargo/stop/', 'duxis/manage_system', function* () {
      //console.log('GET /cargo/stop/');
      setImmediate(() => {
        // Actually stop the app after responding, because stopping the app also stops this API.
        app.stop();
      });
      this.status = 204;
    })
  );
}

/**
 * Returns a promise that obtains the Cargo manifest for the given service.
 * @param {string} service - The name of the service.
 */
function getManifest(service) {
  return request.get(`http://${service}:8080/cargo/manifest/`, { retries: 10 })
    .then((response) => response.data)
    .catch((error) => null);

  // TODO: consider getting manifest as follows:
  //const docker = new Docker();
  //const container = yield docker.getContainerForService(service);
  //const archive = yield container.getArchiveAsync('/cargo/cargo.yaml');
  // The resuilting archive is a TAR - consider tar-stream package to unpack the tar
}

/**
 * Returns a promise that stops the container that is based on the given service name as defined in
 * a Docker Compose file.
 * @param {string} service
 * @returns {Promise}
 */
function stopService(service) {
  return request.get(`http://${service}:8080/cargo/stop/`)
    .catch((error) => console.log(`Failed to stop '${service}':`, error));
}

module.exports = {
  getManifest,
  initCargoApi,
  stopService
};
