'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

/**
 * @module {Object} cargo-lib/utils/geo
 * Geometric utilities.
 */

/** @const */
const GEO_DIST_FACTOR = 360 / (6371 * 2 * Math.PI);

/**
 * Returns the angle (in degrees) corresponding with the given displacement in km.
 * The angle (in degrees) of a displacement of 1 km horizontally along the equator:
 * 1 km = 1 / (2 * 6371 * pi) * 360 degrees = 0.008993216059 degrees.
 * Inversely: 1 degree ~= 111.19492664 km
 *
 * @param {Number} dist - The distance in km.
 * @returns {number}
 */
exports.distToAngle = function (dist) {
  return dist * GEO_DIST_FACTOR;
};

/**
 * Returns the distance (in km) corresponding with the given geographic angle (in degrees) along the
 * equator.
 *
 * @param angle
 * @returns {number}
 */
exports.angleToDist = function (angle) {
  return angle / GEO_DIST_FACTOR;
};

