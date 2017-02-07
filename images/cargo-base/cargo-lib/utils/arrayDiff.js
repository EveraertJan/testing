'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

/**
 * Compares two arrays and returns three arrays:
 * 1) the elements in the first but not the second;
 * 2) the elements in both;
 * 3) the elements in the second but not the third.
 * @param {Array.<*>} first
 * @param {Array.<*>} second
 * @returns {Array.<Array.<*>>}
 */
module.exports = function arrayDiff(first, second) {
  const inFirstOnly = [], inBoth = [], inSecondOnly = [];
  first.forEach((el) => second.includes(el) ? inBoth.push(el) : inFirstOnly.push(el));
  second.forEach((el) => first.includes(el) ? null : inSecondOnly.push(el));
  return [inFirstOnly, inBoth, inSecondOnly];
};
