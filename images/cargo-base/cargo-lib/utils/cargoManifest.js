'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');
const resolve = require('path').resolve;

const Promise = require('bluebird');
const yaml = require('js-yaml');
const _ = require('lodash');

const fs = require('./fs');

// -------------------------------------------------------------------------------------------------

/**
 * @param {Object} man - The Cargo Manifest object.
 */
function assertCargoManifest(man) {
  assert(_.isObject(man), `The manifest must be an object, instead got '${man}'.`);
  assert(_.isString(man.service),
    `Manifest.service must be a string, the id of the service, instead got '${man.service}'.`);
  assert(_.isString(man.version),
    `Manifest.version must be a string, instead got '${man.version}'.`);
  assert(_.isUndefined(man.cargoApp) || _.isBoolean(man.cargoApp),
    `When given, manifest.cargoApp must be a boolean, instead got '${man.cargoApp}'.`);
  assert(_.isUndefined(man.cargoFrontend) || _.isBoolean(man.cargoFrontend),
    `When given, manifest.cargoFrontend must be a boolean, instead got '${man.cargoFrontend}'.`);
  assert(_.isUndefined(man.watchable) || _.isBoolean(man.watchable),
    `When given, manifest.watchable must be a boolean, instead got '${man.watchable}'.`);

  // dependencies
  assert(_.isUndefined(man.dependencies) || (_.isArray(man.dependencies)
      && man.dependencies.every((d) => _.isString(d))),
    `When given, manifest.dependencies must be an array of strings, instead got '${man.dependencies}'.`);

  // unitTests
  assert(_.isUndefined(man.unitTests) || _.isObject(man.unitTests),
    `When given, manifest.unitTests must be an object, instead got '${man.unitTests}'.`);
  if (_.isObject(man.unitTests)) {
    assert(_.isUndefined(man.unitTests.enable) || _.isBoolean(man.unitTests.enable),
      `When given, manifest.unitTests.enable must be a boolean, instead got '${man.unitTests.enable}'.`);
    assert(_.isString(man.unitTests.service),
      `Manifest.unitTests.service must be a string, the id of the test service, instead got '${man.unitTests.service}'.`);
    assert(_.isUndefined(man.unitTests.dependencies) || (_.isArray(man.unitTests.dependencies)
        && man.unitTests.dependencies.every((d) => _.isString(d))),
      `When given, manifest.unitTests.dependencies must be an array of strings, instead got '${man.unitTests.dependencies}'.`);
  }

  assert(_.isUndefined(man.dependencies) || _.isArray(man.dependencies),
    `When given, the manifest.dependencies must be an array.`);
  //man.dependencies.forEach((dep) => assert(_.isString(dep), TODO))
}

/**
 * Returns a promise that loads and resolves to the Cargo manifest, or rejects when the given path
 * is not a Cargo manifest file or a directory that contains a Cargo manifest file.
 *
 * @param {String} path - The path of the Cargo manifest file or a directory that contains a Cargo
 *        manifest file.
 */
function readCargoManifest(path) {
  return Promise.coroutine(function* () {
    let manifestPath = null;
    let stat = yield fs.statAsync(path);
    if (stat.isDirectory()) {
      stat = null;
      manifestPath = resolve(path, 'cargo.yml');
      try {
        stat = yield fs.statAsync(manifestPath);
      }
      catch (error) {}
      if (!stat || !stat.isFile()) {
        manifestPath = resolve(path, 'cargo.yaml');
        stat = yield fs.statAsync(manifestPath);
        if (!stat.isFile()) {
          throw new Error(`No Cargo manifest file could be found in ${path}.`);
        }
      }
    }
    else if (stat.isFile()) {
      manifestPath = path;
    }
    else {
      throw new Error(`The given path (${path}) is not a file, nor a directory.`);
    }

    let manifest = yield fs.readFileAsync(manifestPath);
    manifest = yaml.safeLoad(manifest);
    assertCargoManifest(manifest);
    return manifest;
  })();
}

// -------------------------------------------------------------------------------------------------

module.exports = {
  assert: assertCargoManifest,
  read: readCargoManifest
};
