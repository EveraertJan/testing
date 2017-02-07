'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');
const resolve = require('path').resolve;

const _ = require('lodash');

// -------------------------------------------------------------------------------------------------

/**
 * The options for the webpack.config maker.
 * @typedef {Object} WebpackConfigOptions
 * @property {String} [outputPath = /cargo/html/dist] - The directory in which the packed web
 *           content is stored.
 *           See {@link https://webpack.github.io/docs/configuration.html#output-path}
 * @property {String} [publicPath = /]
 *           See {@link https://webpack.github.io/docs/configuration.html#output-publicpath}
 * @property {Array.<String>} [resolveRoot = ['/cargo/local_modules', '/cargo/html/node_modules']] -
 *           The value for `resolve.root` in the webpack.config object.
 * @property {String|Array.<String>} loadersInclude - The value for the jsx-loader's `include` option.
 * @property {Array.<String>} [vendorModules] - An array of module names that will be packed
 *           separately in vendor.bundle.js. When a vendorModules array is provided in the options
 *           passed to the config maker exported by this module, then these modules are merged with
 *           the default vendorModules array given in {@link defaultOptions}.
 * @property {Array.<String>} [babelPresets] - An array of strings, used as presets query for the
 *           babel-loader.
 *
 * @property {Object} [maskedConfig] - Options passed to webpack-masked-config-plugin.
 *           See {@link https://www.npmjs.com/package/webpack-masked-config-plugin}
 * @property {String} [maskedConfig.source = /cargo/config] -
 *           See webpack-masked-config-plugin docs.
 * @property {String} [maskedConfig.target = /cargo/html/src/config.js] -
 *           See webpack-masked-config-plugin docs.
 * @property {Object} maskedConfig.mask - See webpack-masked-config-plugin docs.
 * @property {Object} maskedConfig.extend - See webpack-masked-config-plugin docs.
 * @property {Function} maskedConfig.morph - See webpack-masked-config-plugin docs.
 * @property {boolean} maskedConfig.debug - See webpack-masked-config-plugin docs.
 * @property {Object} maskedConfig.log - See webpack-masked-config-plugin docs.
 *
 * @property {Object} eslint - Options passed to eslint-loader.
 *           See {@link https://github.com/MoOx/eslint-loader} and
 *           {@link http://eslint.org/docs/developer-guide/nodejs-api#cliengine}.
 * @property {Object} eslint.configFile
 *           See {@link https://github.com/MoOx/eslint-loader#cache-default-false}.
 * @property {Object} eslint.cache
 *           See {@link https://github.com/MoOx/eslint-loader#cache-default-false}.
 */

// -------------------------------------------------------------------------------------------------

const defaultOptions = {
  mode: 'static',
  bail: true,
  outputPath: '/cargo/html/dist',
  publicPath: '/',
  resolveRoot: [
    '/cargo/html/node_modules',
    '/cargo',
    '/cargo/local_modules'
  ],
  loadersInclude: [
    '/cargo/html/src',
    '/cargo/cargo-lib',
    '/cargo/local_modules'
  ],
  vendorModules: [
    'axios',
    //'d3',
    'font-awesome/css/font-awesome.css',
    'lodash',
    'moment',
    'react',
    'react-bootstrap',
    'react-dom',
    //'react-fontawesome',
    'react-redux',
    'react-redux-modal',
    'react-redux-modal/lib/css/react-redux-modal.css',
    'react-router',
    'react-router-bootstrap',
    //'recharts',
    'redux',
    'redux-form',
    'redux-devtools',
    'redux-form'
  ],
  babelPresets: ['stage-0', 'es2015', 'react'],
  maskedConfig: {
    source: '/cargo/config',
    target: '/cargo/html/src/config.js',
    mask: {
      soyl: {
        version: true
      }
    }
  },
  eslint: {
    configFile: '/cargo/cargo-lib/html/.eslintrc'
  }
};

// -------------------------------------------------------------------------------------------------

/**
 * Validates the webpack config options.
 * @param {WebpackConfigOptions} opts
 */
function validateOptions(opts) {
  //console.log('- opts:', opts);

  assert(_.isBoolean(opts.bail),
    'opts.bail must be a boolean, got: ' + opts.bail);
  assert(_.isString(opts.outputPath),
    'opts.outputPath must be a string, got: ' + opts.outputPath);
  assert(_.isString(opts.publicPath),
    'opts.publicPath must be a string, got: ' + opts.publicPath);

  assertStringArray(opts.resolveRoot, 'opts.resolveRoot');
  assertStringArray(opts.vendorModules, 'opts.vendorModules');
  assertStringArray(opts.babelPresets, 'opts.babelPresets');

  if (!_.isUndefined(opts.maskedConfig)) {
    assert(_.isObject(opts.maskedConfig),
      'opts.maskedConfig must be an object, got: ' + opts.maskedConfig);
    assert(_.isUndefined(opts.maskedConfig.source) || _.isString(opts.maskedConfig.source),
      'opts.maskedConfig.source must be a string, got: ' + opts.maskedConfig.source);
    assert(_.isUndefined(opts.maskedConfig.target) || _.isString(opts.maskedConfig.target),
      'opts.maskedConfig.target must be a string, got: ' + opts.maskedConfig.target);
    assert(_.isUndefined(opts.maskedConfig.mask) || _.isObject(opts.maskedConfig.mask),
      'opts.maskedConfig.mask must be an object, got: ' + opts.maskedConfig.mask);
    assert(_.isUndefined(opts.maskedConfig.extend) || _.isObject(opts.maskedConfig.extend),
      'opts.maskedConfig.extend must be an object, got: ' + opts.maskedConfig.extend);
    assert(_.isUndefined(opts.maskedConfig.morph) || _.isFunction(opts.maskedConfig.morph),
      'opts.maskedConfig.morph must be a function, got: ' + opts.maskedConfig.morph);
    assert(_.isUndefined(opts.maskedConfig.debug) || _.isBoolean(opts.maskedConfig.debug),
      'opts.maskedConfig.debug must be an boolean, got: ' + opts.maskedConfig.debug);

    if (!_.isUndefined(opts.maskedConfig.log)) {
      assert(_.isObject(opts.maskedConfig.log),
        'opts.maskedConfig.log must be an object, got: ' + opts.maskedConfig.log);
      assert(_.isFunction(opts.maskedConfig.log.debug),
        'opts.maskedConfig.log.debug must be a function, got: ' + opts.maskedConfig.log.debug);
      assert(_.isFunction(opts.maskedConfig.log.error),
        'opts.maskedConfig.log.error must be a function, got: ' + opts.maskedConfig.log.error);
    }
  }

  if (!_.isUndefined(opts.eslint)) {
    assert(_.isObject(opts.eslint),
      'opts.eslint must be an object, got: ' + opts.eslint);
    assert(_.isUndefined(opts.eslint.configFile) || _.isString(opts.eslint.configFile),
      'opts.eslint.configFile must be a string, got: ' + opts.bail);
    assert(_.isUndefined(opts.eslint.cache) || _.isBoolean(opts.eslint.cache),
      'opts.eslint.cache must be a boolean, got: ' + opts.bail);
  }
}

function assertStringArray(ary, lbl) {
  assert(_.isArray(ary),
    lbl + ' must be an array, got: ' + ary);
  assert(ary.every(_.isString),
    lbl + ' must contain strings, got: ['
    + ary.map((m) => _.isString(m) ? `"${m}"` : `${m}`).join(', ')
    + '], of which the following are not strings: ['
    + ary.filter((m) => !_.isString(m)).map((m) => `'${m}'`).join(', ') + '].');
}

// -------------------------------------------------------------------------------------------------

function mergeOptions (input, defaults) {
  assert(_.isObject(input) || _.isUndefined(input), 'input must be an array, got ' + input);
  assert(_.isObject(defaults) || _.isUndefined(defaults), 'a1 must be an array, got ' + defaults);
  if (_.isUndefined(input)) { return defaults; }
  if (_.isUndefined(defaults)) { return input; }
  const result = _.defaults({}, input, defaults);

  if (!_.isUndefined(input.maskedConfig) && !_.isUndefined(defaults.maskedConfig)) {
    result.maskedConfig = _.defaults({}, input.maskedConfig, defaults.maskedConfig);
  }
  if (!_.isUndefined(input.vendorModules) && !_.isUndefined(defaults.vendorModules)) {
    result.vendorModules = mergeArrays(input.vendorModules, defaults.vendorModules);
    //console.log('- merged vendorModules: '
    //  + result.vendorModules.map((m) => _.isString(m) ? `"${m}"` : `${m}`).join(', '));
  }
  if (!_.isUndefined(input.vendorModules) && !_.isUndefined(defaults.vendorModules)) {
    result.vendorModules = mergeArrays(input.vendorModules, defaults.vendorModules);
    //console.log('- merged vendorModules: '
    //  + result.vendorModules.map((m) => _.isString(m) ? `"${m}"` : `${m}`).join(', '));
  }
  if (!_.isUndefined(input.resolveRoot) && !_.isUndefined(defaults.resolveRoot)) {
    result.resolveRoot = mergeArrays(input.resolveRoot, defaults.resolveRoot);
    //console.log('- merged resolveRoot: '
    //  + result.resolveRoot.map((m) => _.isString(m) ? `"${m}"` : `${m}`).join(', '));
  }
  return result;
}

/**
 * Returns the union of the given arrays as a set.
 * @param {Array} [a1]
 * @param {Array} [a2]
 * @returns {Array}
 */
function mergeArrays(a1, a2) {
  assert(_.isArray(a1) || _.isUndefined(a1), 'a1 must be an array, got ' + a1);
  assert(_.isArray(a2) || _.isUndefined(a2), 'a1 must be an array, got ' + a2);
  if (_.isUndefined(a1)) { return a2; }
  if (_.isUndefined(a2)) { return a1; }
  return _.uniq(a1.concat(a2));
}

module.exports = {
  defaultOptions,
  validateOptions,
  mergeOptions
};
