'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

//import { replace } from 'react-router-redux'

import errorActions from '../components/ErrorModal/actions'
import userActions from '../auth/users/actions'

/**
 * @param {Error} error
 * @param {Function} dispatch
 * @param {Object} location - The location object set on the React props by React Router. This is
 *        the location to which the front-end should return after a successful authentication.
 * @returns {Promise.<Object>} - The response object the `axios.get` promise resolves to.
 * @private
 */
export default function handleApiError(error, dispatch, location) {
  //console.log('>> handleApiError - error:', error);
  if (error.response) {
    // The request was made, but the server responded with a status code that falls out of
    // the range of 2xx (or the range set in the validateStatus config option).
    // For more details see: https://github.com/mzabriskie/axios#handling-errors
    if (error.response.status === 401) {
      // Not authenticated or token expired, redirect to login page:
      dispatch(userActions.logout({ showLogin: true, location }));
    }
    else if (error.response.status === 403) {
      // Not authorized...
      dispatch(errorActions.showError('You are not authorized to access this resource.'));
    }
    else {
      console.error('error.response.data:', error.response.data);
      let msg = `Unexpected error with status ${error.response.status}.`;
      if (error.response.data) {
        msg += ` ${error.response.data}`;
      }
      dispatch(errorActions.showError(msg));
    }
  }
  else {
    const msg = `Unexpected error: ${error.message || error}.`;
    dispatch(errorActions.showError(msg));
  }
}
