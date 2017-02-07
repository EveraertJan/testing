'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

class ServerError extends Error {

  /**
   * @param {string} message
   * @param {number} [status=500] - The error handling middleware in cargo-lib/APIServer uses this
   *        value as response status.
   */
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
    else {
      this.stack = (new Error(message)).stack;
    }
  }

}

module.exports = ServerError;
