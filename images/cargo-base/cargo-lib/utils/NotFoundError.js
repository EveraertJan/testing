'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const ServerError = require('./ServerError');

class NotFoundError extends ServerError {

  constructor(msg) {
    super(msg, 404);
  }

}

module.exports = NotFoundError;
