'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

/**
 * Throws a RangeError when the given predicate is false.
 * @param {boolean} predicate
 * @param {string} msg - The error message to include in the RangeError instance.
 */
module.exports = function (predicate, msg) {
  if (!predicate) {
    throw new RangeError(msg);
  }
};
