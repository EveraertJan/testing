'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import axios from 'axios'
import { isString } from 'lodash'

class Request {

  /**
   * Initialize the request singleton. This should be called once during startup.
   * @param {redux.store} store - The Redux store, which is used to obtain the jwt-token.
   */
  initialize(store) {
    this._store = store;
  }

  /**
   * Returns a promise that authorizes the given user on the given api and resolves to the resulting
   * jwt-token, or rejects when the authentication failed.
   * @param {string} apiHost - The auth API host.
   * @param {string} username
   * @param {string} password
   */
  authenticate(apiHost, username, password) {
    return this.post(`${apiHost}/auth/authenticate/`, { username, password })
      .then((response) => response.data.user.token);
  }

  /**
   * Returns a promise that dispatches a DELETE HTTP request using Axios.
   * @param {String} route - The API route.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Promise.<Object>}
   * @private
   */
  del(route, auth) {
    return axios.delete(route, this._config(auth))
      .catch((error) => {
        error.route = route;
        throw error;
      });
  }

  /**
   * Returns a promise that dispatches a GET HTTP request using Axios.
   * @param {String} route - The API route.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Promise.<Object>}
   * @private
   */
  get(route, auth) {
    return axios.get(route, this._config(auth))
      .catch((error) => {
        //console.log('_get > catch:', error, (typeof error));
        error.route = route;
        throw error;
      });
  }

  /**
   * Returns a promise that dispatches a HEAD HTTP request using Axios.
   * @param {String} route - The API route.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Promise.<Object>}
   * @private
   */
  head(route, auth) {
    return axios.head(route, this._config(auth))
      .catch((error) => {
        error.route = route;
        throw error;
      });
  }

  /**
   * Returns a promise that dispatches a PATCH HTTP request using Axios.
   * @param {String} route - The API route.
   * @param {*} body - The data to send in the body of the request.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Promise.<Object>}
   * @private
   */
  patch(route, body, auth) {
    return axios.patch(route, body, this._config(auth))
      .catch((error) => {
        error.route = route;
        throw error;
      });
  }

  /**
   * Returns a promise that dispatches a POST HTTP request using Axios.
   * @param {String} route - The API route.
   * @param {*} data - The data to send in the body of the request.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Promise.<Object>}
   * @private
   */
  post(route, data, auth) {
    return axios.post(route, data, this._config(auth))
      .catch((error) => {
        error.route = route;
        throw error;
      });
  }

  /**
   * Returns a promise that dispatches a PUT HTTP request using Axios.
   * @param {String} route - The API route.
   * @param {*} data - The data to send in the body of the request.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Promise.<Object>}
   * @private
   */
  put(route, data, auth) {
    return axios.put(route, data, this._config(auth))
      .catch((error) => {
        error.route = route;
        throw error;
      });
  }

  /**
   * Returns an Axios config object.
   * @param {boolean|String} [auth = false] - When true or a string then add an Authorization header
   *        in the request. Use the given string as token or use the token in the Redux store.
   * @returns {Object|null}
   * @private
   */
  _config(auth) {
    if (!auth) { return null; }

    let token;
    if (isString(auth)) { token = auth; }
    else {
      if (!this._store) {
        throw new Error('The request singleton is not initialized.');
      }
      const state = this._store.getState();
      if (!state.user || !state.user.token) {
        console.log('state:', state);
        throw new Error('The user is not (yet) authenticated.');
      }
      token = state.user.token;
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    };
  }

}

const request = new Request();

export default request;
