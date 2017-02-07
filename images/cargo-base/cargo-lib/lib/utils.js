'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

//const basename = require('path').basename;

//const _ = require('lodash');
//const Promise = require('bluebird');
//const fs = Promise.promisifyAll(require('fs-extra'));

// #################################################################################################
// Filesystem utils
// -------------------------------------------------------------------------------------------------

/**
 * Returns a promise that resolves when the given path points to a regular file or rejects otherwise.
 *
 * @param {String} path - The file path.
 * @returns {Promise.<Boolean>}
 */
//exports.fileExists = function (path) {
//  return fs.statAsync(path)
//    .then((stat) => stat.isFile())
//    .catch(() => false);
//};

/**
 * Returns a promise that revolves to a string that denotes the type of the resource on the given
 * path.
 *
 * @param {String} path
 * @returns {Promise.<String>}
 */
//exports.resourceType = function (path) {
//  return fs.lstatAsync(path)
//    .then((stat) => {
//      if (stats.isFile()) { return 'file'; }
//      if (stats.isDirectory()) { return 'directory'; }
//      if (stats.isBlockDevice()) { return 'blockDevice'; }
//      if (stats.isCharacterDevice()) { return 'characterDevice'; }
//      if (stats.isSymbolicLink()) { return 'symbolicLink'; }
//      if (stats.isFIFO()) { return 'FIFO'; }
//      if (stats.isSocket()) { return 'socket'; }
//      return 'unknown';
//    })
//    .catch(() => 'null');
//};

/**
 * Returns a promise that (asynchronously) get the list of directories in the given path and maps
 * the given function on this list. Depending on the `fullDir` options, the directory name or the
 * full path is passed as argument to this function. The function may return a promise, in wich case
 * the mapDirectories promise only resolves when the mapfn promises resolve.
 *
 * @param {string} path
 * @param {function} mapfn
 * @param {boolean} fullDir - When true then the full directory path is passed to the mapfn.
 * @returns {Promise}
 */
//function mapDirs(path, mapfn, { fullDir }) {
//  return fs.readdirAsync(path)
//    .filter((name) => fs.statAsync(resolve(path, name))
//      .then((stat) => stat.isDirectory())
//      .catch(E.FileAccessError, () => false))
//    .map(({ name, path }) => mapfn(fullDir ? path : name));
//}

/**
 * Returns a object structure that represents the directory tree rooted in the given file path.
 * @param {String} dir - Path to the root of the returned tree.
 * @returns {Object}
 */
//exports.dirTree = function (dir) {
//  const stats = fs.lstatSync(dir);
//  const result = {
//    path: dir,
//    name: basename(dir)
//  };
//
//  if (stats.isDirectory()) {
//    result.type = "folder";
//    result.children = fs.readdirSync(dir).map((child) => exports.dirTree(dir + '/' + child));
//  }
//  else {
//    // Assuming it's a file. In real life it could be a symlink or something else...
//    result.type = "file";
//  }
//
//  return result;
//};
