'use strict';

/**
 * A promisified Dockerode.
 * Derived from https://github.com/Quobject/dockerode-bluebird/blob/master/index.js, adding
 * promisified network objects, and some utility methods, i.e.:
 *   - container.existsAsync()
 *   - image.existsAsync()
 *   - network.existsAsync()
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Promise = require('bluebird');
const fs = require('cargo-lib/utils/fs');
const DockerBase = require('dockerode');

// Promisify DockerBase:
Promise.promisifyAll(DockerBase.prototype);

const defaultSocketPath = '/var/run/docker.sock';

class Docker extends DockerBase {

  constructor({ socketPath = defaultSocketPath } = {}) {
    super();
    this.socketPath = socketPath;
    this._assertedSock = false;
  }

  getContainer(...args) {
    this._assertSockSync();
    const container = super.getContainer(...args);
    if (!container.startAsync) {
      const prototype = Object.getPrototypeOf(container);

      const _exec = prototype.exec;
      prototype.exec = function (opts, cb) {
        _exec.call(this, opts, function (err, exec) {
          if (exec && !exec.startAsync) {
            Promise.promisifyAll(Object.getPrototypeOf(exec));
          }
          cb(err, exec);
        });
      };

      Promise.promisifyAll(prototype);

      /**
       * Returns a promise that resolves to true when the container exists, or false otherwise.
       * @returns {Promise.<boolean>}
       */
      prototype.existsAsync = function () {
        return this.inspectAsync().then(() => true).catch(() => false);
      }
    }
    return container;
  };

  getImage() {
    this._assertSockSync();
    const image = super.getImage.apply(this, arguments);
    if (!image.getAsync) {
      const prototype = Object.getPrototypeOf(image);
      Promise.promisifyAll(prototype);

      /**
       * Returns a promise that resolves to true when the image exists, or false otherwise.
       * @returns {Promise.<boolean>}
       */
      prototype.existsAsync = function () {
        return this.inspectAsync().then(() => true).catch(() => false);
      }
    }
    return image;
  };

  getNetwork() {
    this._assertSockSync();
    const network = super.getNetwork.apply(this, arguments);
    if (!network.getAsync) {
      const prototype = Object.getPrototypeOf(network);
      Promise.promisifyAll(prototype);

      /**
       * Returns a promise that resolves to true when the network exists, or false otherwise.
       * @returns {Promise.<boolean>}
       */
      prototype.existsAsync = function () {
        return this.inspectAsync().then(() => true).catch(() => false);
      }
    }
    return network;
  }

  /**
   * Returns a promise that resolves to the currently active container that is based on the given
   * service name (as defined in a Docker Compose file) or the image name (with optional tag), or
   * image id.
   * @param {string} service - Service name (as defined in a Docker Compose file) or the image name
   * (with optional tag), or image id.
   * @returns {Promise.<Container>}
   */
  getContainerForService(service) {
    return Promise.coroutine(function* () {
      yield this._assertSockAsync();

      const opts = {
        filters: {
          label: [`com.docker.compose.service=${service}`]
        }
      };
      const results = yield this.listContainersAsync(opts);
      if (results.length === 0) {
        return null;
      }
      else if (results.length === 1) {
        return results[0];
      }
      else {
        throw new Error('There are multiple containers for this service.');
      }
    }.bind(this))();
  }

  /**
   * Checks if `/var/run/docker.sock` is properly mounted in the container.
   */
  _assertSockSync() {
    if (!this._assertedSock) {
      try {
        fs.assertSocketSync(this.socketPath);
        this._assertedSock = true;
      }
      catch (error) {
        const msg = `${this.socketPath} is missing. Your volume bindings should include '/var/run/docker.sock:${this.socketPath}'.`;
        console.error(msg);
        throw new Error(msg);
      }
    }
  }

  /**
   * Checks if `/var/run/docker.sock` is properly mounted in the container.
   */
  _assertSockAsync() {
    if (this._assertedSock) { return Promise.resolve(); }
    return fs.assertSocketAsync(this.socketPath).then(
      () => {
        this._assertedSock = true;
      },
      () => {
        const msg = `${this.socketPath} is missing. Your volume bindings should include '/var/run/docker.sock:${this.socketPath}'.`;
        console.error(msg);
        throw new Error(msg);
      });
  }

}

module.exports = Docker;
