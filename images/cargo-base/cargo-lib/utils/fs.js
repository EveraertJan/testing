'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

//const resolve = require('path').resolve;

const assert = require('assert');
const Promise = require('bluebird');
const fsExtra = require('fs-extra');
const yaml = require('js-yaml');
const _ = require('lodash');

// -------------------------------------------------------------------------------------------------

const fs = Promise.promisifyAll(fsExtra);

/**
 * Returns a promise that resolves to true if the given path is a directory, or resolves to false
 * otherwise.
 *
 * @param {String} path
 * @returns {Promise.<boolean>}
 */
fs.isDirectoryAsync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  return fs.lstatAsync(path)
    .then((stats) => stats.isDirectory())
    .catch(() => false);
};

/**
 * Returns a promise that resolves if the given path is a directory, or rejects otherwise.
 *
 * @param {String} path
 * @returns {Promise}
 */
fs.assertDirectoryAsync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  return fs.lstatAsync(path)
    .then((stats) => {
      if (!stats.isDirectory()) {
        throw new Error('is not a directory');
      }
    });
};

/**
 * Returns a promise that resolves to true if the given path is a file, or resolves to false
 * otherwise.
 *
 * @param {String} path
 * @returns {Promise.<boolean>}
 */
fs.isFileAsync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  return fs.lstatAsync(path)
    .then((stats) => stats.isFile())
    .catch(() => false);
};

/**
 * Returns a promise that resolves if the given path is a file, or rejects otherwise.
 *
 * @param {String} path
 * @returns {Promise}
 */
fs.assertFileAsync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  return fs.lstatAsync(path)
    .then((stats) => {
      if (!stats.isFile()) {
        throw new Error('The given path is not a file');
      }
    });
};

/**
 * Returns a promise that resolves to true if the given path is a socket, or resolves to false
 * otherwise.
 *
 * @param {String} path
 * @returns {Promise.<boolean>}
 */
fs.isSocketAsync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  return fs.lstatAsync(path)
    .then((stats) => stats.isSocket())
    .catch(() => false);
};

/**
 * Asserts that the given path is a socket.
 *
 * @param {String} path
 */
fs.assertSocketSync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  try {
    const stats = fs.lstatSync(path);
    if (!stats.isSocket()) {
      throw new Error('The given path is not a socket');
    }
  }
  catch (error) {
    throw new Error('The given path is not a socket');
  }
};

/**
 * Returns a promise that resolves if the given path is a socket, or rejects otherwise.
 *
 * @param {String} path
 * @returns {Promise}
 */
fs.assertSocketAsync = function (path) {
  assert(_.isString(path) || _.isBuffer(path), 'The given path must a string or buffer.');
  return fs.lstatAsync(path).then(
    (stats) => {
      if (!stats.isSocket()) {
        throw new Error('The given path is not a socket');
      }
    },
    () => {
      throw new Error('The given path is not a socket');
    });
};

/**
 * Returns a promise that reads the yaml file on the given path and resolves to the resulting data
 * structure.
 *
 * @param {String} path
 * @returns {Promise.<*>}
 */
fs.readYamlAsync = function (path) {
  return fs.readFileAsync(path)
    .then((content) => yaml.safeLoad(content));
};

// -------------------------------------------------------------------------------------------------

module.exports = fs;
