/*eslint-env node */

'use strict';

/**
 * @module This module should export the webpack.config object. You can use the helper function
 * `createConfig`, imported from `cargo-lib/html/createConfig` to facilitate the creation of the
 * webpack.config object.
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const createConfig = require('cargo-lib/html/createConfig');
const { mergeOptions } = require('cargo-lib/html/configOptions');

/**
 * Project specific default Webpack config options.
 * @type {WebpackConfigOptions} - See module:cargo-lib/html/configOptions
 */
const defaults = {
  vendorModules: [
    'socket.io-client'
  ],
  maskedConfig: {
    mask: {
      soyl: {
        auth: { api: true },
        projectName: true,
        traefik: { dashboardHost: true },
        version: true
      },
      wijzeStad: {
        hosts: {
          admin: true,
          api: true,
          pg: true
        },
        logStreamPort: true,
        logServicePanel: { logItemsList: { maxItems: true } }
      }
    }
  }
};

/**
 * @param {WebpackConfigOptions} options
 * @returns {Object} A Webpack config object based on the given options, the default options,
 *          and the value of options.mode.
 */
module.exports = (mode, options) => {
  return createConfig(mode, mergeOptions(options, defaults));
};
