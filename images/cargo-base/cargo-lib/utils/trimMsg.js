'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const _ = require('lodash');

// -------------------------------------------------------------------------------------------------

/**
 * @param {String|JSON} msg - The message to trim.
 * @param {int} [length = 64] - The target message length.
 * @returns {String} Trimmed message string.
 */
module.exports = function (msg, length) {
  if (!_.isString(msg)) { msg = JSON.stringify(msg); }
  if (!_.isInteger(length)) { length = 64; }
  return msg.length > length ? msg.substr(0, length) + ' ...' : msg;
};
