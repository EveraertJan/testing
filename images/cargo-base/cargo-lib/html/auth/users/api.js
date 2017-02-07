'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import config from '../../system/config'
import request from '../../system/request'

const AUTH_API = config.soyl.auth.api;
//console.log('- AUTH_API:', AUTH_API);

function authenticate(username, password) {
  if (!username) { throw new Error('The username parameter is missing.'); }
  if (!password) { throw new Error('The password parameter is missing.'); }
  const route = `${AUTH_API}/authenticate/`;
  return request.post(route, { username, password })
    .then((response) => {
      //console.log('- authenticate > response.data:', response.data);
      if (response.data.error) {
        throw new Error(`Failed to authenticate: ${response.data.error}`);
      }
      if (!response.data.user.token) {
        throw new Error('The response.data.user.token property is missing.');
      }
      return response.data.user;
    });
}

function fetchActivities(username) {
  if (!username) { throw new Error('The username parameter is missing.'); }
  const route = `${AUTH_API}/users/${username}/activities/`;
  return request.get(route, true)
    .then((response) => {
      console.log('- response.data:', response.data);
      return response.data.activities;
    });
}

/**
 * @param {string} username - The name of the user for which to fetch details.
 * @param {string} [token] The jwt-token to authenticate with. When not given, the token from the
 *        Redux store is used.
 * @returns {Promise.<Object>}
 */
function fetchUser(username, token) {
  if (!username) { throw new Error('The username parameter is missing.'); }
  const route = `${AUTH_API}/users/${username}/`;
  return request.get(route, token || true)
    .then((response) => {
      //console.log('- fetchUser > response.data:', response.data);
      return response.data.user;
    });
}

export default {
  fetchActivities,
  fetchUser,
  authenticate
}
