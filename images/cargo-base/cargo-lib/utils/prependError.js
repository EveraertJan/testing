'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const _ = require('lodash');

// -------------------------------------------------------------------------------------------------

/**
 * Takes an error object and a message string; creates a proper error object when the given one
 * is not; prepends the given message to the error's message; and returns the resulting error object.
 *
 * @param {Error|*} error
 * @param {String} msg
 * @returns {Error}
 */
module.exports = function (error, msg) {
  if (!_.isError(error)) { error = new Error(error); }

  try { error.message = `${msg} ${error.message}`; }
  catch (error) {}

  return error;
};
