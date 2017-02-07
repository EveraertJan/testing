'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const chai = require('chai');
const _ = require('lodash');

const assert = chai.assert;

/**
 * Takes a status code and a promise returned by axios.get/post/update/etc. and returns a promise
 * that asserts that the request fails with the given status code. When these conditions
 * are met, the promise resolves to undefined, or else rejects.
 *
 * Usage Examples:
 * ```
 *   failStatus(401, axios.get(route, config)).then(() => log.debug('Not authenticated.'));
 *   yield failStatus(403, axios.get(route, config));
 *   yield failStatus(404, axios.post(route, data, config));
 * ```
 *
 * @param expectedStatus
 * @param axiosPromise
 * @returns {Promise.<*>}
 */
module.exports = function failStatus(expectedStatus, axiosPromise) {
  //return assert.becomes(promise.catch((error) => error.response.status), status);
  //return new Promise((resolve, reject) => {
  //});
  return axiosPromise.then(
    (response) => {
      let msg = `The axios call was expected to fail with status ${expectedStatus}.`;
      if (_.isUndefined(response)) {
        msg += ` Instead got undefined response.`;
      }
      else if (_.isUndefined(response.status)) {
        msg += ` Instead got response without status.`;
      }
      else {
        msg += ` Instead got response with status ${response.status}.`;
      }
      assert(false, msg);
    },
    (error) => {
      let responseStatus;
      if (error.response) {
        // The Axios Promise will always reject with an Error. In the case that a response was
        // received, the Error will also include the response.
        // See https://github.com/mzabriskie/axios/blob/master/UPGRADE_GUIDE.md#012x---0130
        responseStatus = error.response.status;
      }
      else {
        responseStatus = error.status; // Typically this will be undefined.
      }
      if (responseStatus === expectedStatus) {
        return error;
      }
      else {
        let msg = `The axios call was expected to fail with status ${expectedStatus}.`;
        if (_.isUndefined(responseStatus)) {
          msg += ` Instead got ${error}.`;
        }
        else {
          msg += ` Instead got status ${responseStatus}.`;
        }
        assert(false, msg);
      }
    }
  );
};
