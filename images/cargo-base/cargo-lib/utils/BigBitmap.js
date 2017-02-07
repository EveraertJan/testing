'use strict';

/**
 * @module cargo-lib/utils/BigBitmap
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const bigInt = require("big-integer");
const _ = require('lodash');

// -------------------------------------------------------------------------------------------------

const RADIX = 35;

// -------------------------------------------------------------------------------------------------

/**
 * Represents a indexed set of boolean values (bits) in an efficient manner. There is no limit on
 * the size of the bitmap.
 * You can:
 * - Efficiently check if the bit at a given index is set;
 * - Efficiently check if two bitmaps are equal;
 * - Efficiently check if two bitmaps have at least one common bit set;
 * - Represent the bitmap as a compact string;
 *
 * @type {BigBitmap}
 */
module.exports = class BigBitmap {

  /**
   * @param {Number[]|[String]|[String, Number]} indices - Either an array of indices for which the
   *        bits in the map are true, or a string representation of a BitBitMap serialized using the
   *        default radix or the radix given as the second argument.
   */
  constructor(...indices) {
    if (_.isString(indices[0])) {
      if (_.isNumber(indices[1])) {
        this.bmp = bigInt(indices[0], indices[1]);
      }
      else {
        this.bmp = bigInt(indices[0], RADIX);
      }
    }
    else {
      this.bmp = indices.reduce((bmp, index) => bmp.or(bigInt[2].pow(index)), bigInt.zero);
    }
  }

  /**
   * Adds the given index in the bitmap.
   * @param {Number} index
   */
  add(index) {
    this.bmp = this.bmp.or(bigInt[2].pow(index));
  }

  /**
   * @param {Number} index
   * @returns {boolean} True when the bit at the given index in this bitmap is set.
   */
  has(index) {
    return _.isNumber(index) && !this.bmp.and(bigInt[2].pow(index)).isZero();
  }

  /**
   * @param {BigBitmap} bitmap
   * @returns {boolean} True when this bitmap and the given bitmap are equal.
   */
  eq(bitmap) {
    return (bitmap instanceof BigBitmap) && this.bmp.eq(bitmap.bmp);
  }

  /**
   * @param {BigBitmap} bitmap
   * @returns {boolean} True when at least one bit is set in this bitmap and the given bitmap.
   */
  intersects(bitmap) {
    return (bitmap instanceof BigBitmap) && !this.bmp.and(bitmap.bmp).isZero();
  }

  /**
   * Converts the bitmap to a string.
   * @param {Number} [radix]
   * @returns {String}
   */
  toString(radix = RADIX) {
    return this.bmp.toString(radix);
  }

  /**
   * The first argument is a string representation of a bigInt obtained using the toString method
   * above with the default radix. The second argument is the index of a bit. This static method
   * returns true when the bit at the given index in the big integer is set.
   * @param {String} str
   * @param {Number} index
   */
  static hasIndex(str, index) {
    return !_.isUndefined(str)
      && !_.isUndefined(index)
      && !bigInt(str, RADIX).and(bigInt[2].pow(index)).isZero();
  }

};
