'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const TOKEN_KEY = 'user_token';
const USERNAME_KEY = 'user_username';

/**
 * Store essential user data locally.
 * @param {String} username
 * @param {Object} token
 */
function storeUserData(username, token) {
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Returns the locally stored username.
 * @returns {String}
 */
function getStoredUsername() {
  try { return localStorage.getItem(USERNAME_KEY); }
  catch (error) { return null; }
}

/**
 * Returns the locally stored token.
 * @returns {Object}
 */
function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch (error) { return null; }
}

/**
 * Clear all locally stored user data.
 */
function clearStorage() {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export default {
  clearStorage,
  getStoredUsername,
  getStoredToken,
  storeUserData
}
