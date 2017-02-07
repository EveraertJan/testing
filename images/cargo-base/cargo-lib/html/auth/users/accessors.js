'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import { isFunction } from 'lodash'

export default {
  authenticationFailed: (state) => state.user.authenticationFailed,

  /**
   * @param {Object} state - The current state
   * @param {Array.<String>} activities - One or more activity labels.
   * @returns {boolean} True if the current user is authorized to perform all the given activities.
   */
  can: (state, ...activities) => {
    //console.log(`>> accessors.can(${activities}) for user: ${state.user.username}, with rights: ${state.user.activities}`)
    return state.user.isRoot || activities.every((act) => state.user.activities.includes(act));
  },

  getAuthenticationError: (state) => state.user.error,

  /**
   * Returns the token from the Redux state.
   * @param {Object|Function} state - The Redux state or a function that returns the state.
   * @returns {String}
   */
  getToken: (state) => {
    if (isFunction(state)) {
      state = state();
    }
    return state.user.token
  },

  getUsername: (state) => state.user.username,

  getUserActivities: (state) => state.user.activities,

  /**
   * Returns true when the current user is authenticated using the `LoginPage` component.
   * @param {Object} state - The redux state.
   * @returns {boolean}
   */
  isAuthenticated: (state) => state.user.authenticated,

  /**
   * Returns true when the current user is being authenticated using the `LoginPage` component, i.e.
   * the authentication request has been sent to the api and we're awaiting the response.
   * @param {Object} state - The redux state.
   * @returns {boolean}
   */
  isAuthenticating: (state) => state.user.authenticating,

  isRoot: (state) => state.user.isRoot,

  userInitialized: (state) => state.user.initialized
}
