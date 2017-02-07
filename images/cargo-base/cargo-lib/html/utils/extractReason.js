'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

/**
 * @param {Error} error
 * @returns {String} - A nice error reason string.
 * @private
 */
export default function (error) {
  //console.log('>> extractReason() - error:', error);
  if (error.response) {
    //console.log('- error.response:', error.response);
    // The request was made, but the server responded with a status code that falls out of
    // the range of 2xx (or the range set in the validateStatus config option).
    // For more details see: https://github.com/mzabriskie/axios#handling-errors
    if (error.response.status === 401) {
      return `401: ${error.response.data || 'Not authenticated or token expired.'}`;
    }
    else if (error.response.status === 403) {
      return `403: ${error.response.data || 'Not authorized.'}`;
    }
    else {
      return `${error.response.status}: ${error.response.data || 'Error'}`;
    }
  }
  else {
    return `Unexpected error: ${error.message || error}.`;
  }
}
