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
 * that asserts that the request succeeded with the given status code. When these conditions
 * are met, the promise resolves to the result of the axios-promise, or else rejects.
 *
 * Usage Examples:
 * ```
 *   successStatus(200, axios.get(route, config)).then((response) => ...);
 *   yield successStatus(204, axios.post(route, data, config));
 *   const response = yield successStatus(200, axios.get(route, config));
 * ```
 *
 * @param {number} status - The status code.
 * @param {Promise} axiosPromise - A promise returned by axios.get/post/update/etc.
 * @returns {Promise.<*>}
 */
module.exports = function successStatus(status, axiosPromise) {
  return axiosPromise.then(
    (result) => {
      assert.equal(result.status, status);
      return result;
    },
    (error) => {
      let msg = `The axios call was expected to succeed with status ${status}.`;
      if (_.isUndefined(error.status)) {
        msg += ` Instead got ${error}.`;
      }
      else {
        msg += ` Instead got status ${error.status}.`;
      }
      assert(false, msg);
      return undefined;
    }
  );
};
