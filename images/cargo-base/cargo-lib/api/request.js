'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const assert = require('assert');

const axios = require('axios');
const _ = require('lodash');
const ftpromise = require('retrying-promise');

const defaultTryOpts = {
  factor: 1,
  minTimeout: 1000,
  retries: 1
};

/**
 * Returns a promise that dispatches a GET HTTP request using Axios.
 * @param {String} url - The API url.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Promise.<Object>}
 * @private
 */
function get(url, token, opts) {
  return _try(() => axios.get(url, _config(token, opts)), opts || token);
}

/**
 * Returns a promise that dispatches a POST HTTP request using Axios.
 * @param {String} url - The API url.
 * @param {*} data - The data to send in the body of the request.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Promise.<Object>}
 * @private
 */
function post(url, data, token, opts) {
  return _try(() => axios.post(url, data, _config(token, opts)), opts || token);
}

/**
 * Returns a promise that dispatches a DELETE HTTP request using Axios.
 * @param {String} url - The API url.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Promise.<Object>}
 * @private
 */
function del(url, token, opts) {
  return _try(() => axios.delete(url, _config(token, opts)), opts || token);
}

/**
 * Returns a promise that dispatches a PUT HTTP request using Axios.
 * @param {String} url - The API url.
 * @param {*} data - The data to send in the body of the request.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Promise.<Object>}
 * @private
 */
function put(url, data, token, opts) {
  return _try(() => axios.put(url, data, _config(token, opts)), opts || token);
}

/**
 * Returns a promise that dispatches a PATCH HTTP request using Axios.
 * @param {String} url - The API url.
 * @param {*} data - The data to send in the body of the request.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Promise.<Object>}
 * @private
 */
function patch(url, data, token, opts) {
  return _try(() => axios.patch(url, data, _config(token, opts)), opts || token);
}

/**
 * Returns a promise that dispatches a HEAD HTTP request using Axios.
 * @param {String} url - The API url.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Promise.<Object>}
 * @private
 */
function head(url, token, opts) {
  return _try(() => axios.head(url, _config(token, opts)), opts || token);
}

/**
 * Returns a promise that tries to execute the delegate function, and retries if it rejects.
 * @param {function} delegate - A function that should return a promise.
 * @param {Object} opts
 * @returns {Promise}
 * @private
 */
function _try(delegate, opts) {
  assert(_.isFunction(delegate), `The delegate param should be a function, instead got ${delegate}`)
  let tryOpts;
  if (_.isObject(opts) && opts.retries) {
    tryOpts = Object.assign({}, defaultTryOpts, { retries: opts.retries });
  }
  else {
    tryOpts = defaultTryOpts;
  }
  return ftpromise(tryOpts, function (resolve, retry) {
    delegate().then(
      resolve,
      (error) => retry(new Error(error.data || error.message)));
  });
}

/**
 * Returns an Axios config object.
 * @param {String} [token] - The jwt token to authenticate with.
 * @param {String} [opts] - Optional options to be passed to the corresponding Axios method.
 * @returns {Object|null}
 * @private
 */
function _config(token, opts) {
  if (!token && !opts) { return null; }
  if (_.isObject(token)) { return token; }
  if (_.isString(token)) {
    let result = opts ? Object.assign({}, opts) : {};
    if (!result.headers) { result.headers = {}; }
    result.headers.Authorization = `Bearer ${token}`;
    result.headers['Cache-Control'] = 'no-cache';
    return result;
  }
  return opts;
}

module.exports = {
  del,
  get,
  head,
  patch,
  post,
  put
};
