'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const uuid = require('uuid');

/**
 * @returns {String} A new uuid.
 */
module.exports = function () {
  return uuid.v1();
};
