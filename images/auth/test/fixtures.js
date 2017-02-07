'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const config = require('cargo-lib/config');

const authManagerOpts = {
  jwtExpiresIn: 600,
  jwtSecret: 'secret',
  redisHost: config.get('soyl.auth.storeHost')
};

/**
 * Returns an Axios configuration object that includes the auth header with the given token.
 * @param {String} token
 * @returns {Object}
 */
function acnf(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    }
  };
}

module.exports = {
  acnf,
  authManagerOpts
};
