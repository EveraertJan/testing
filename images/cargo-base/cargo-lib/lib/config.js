'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

// -------------------------------------------------------------------------------------------------

// Set the path to the directory containing the configuration files.
// See https://github.com/lorenwest/node-config
process.env.NODE_CONFIG_DIR = '/cargo/config';

// Load the configuration.
// Important: Do this after setting NODE_CONFIG_DIR!
const config = require('config');

// -------------------------------------------------------------------------------------------------

module.exports = config;
