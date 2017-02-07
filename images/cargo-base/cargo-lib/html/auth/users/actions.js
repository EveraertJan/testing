'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import { replace } from 'react-router-redux'

import errorModalActions from '../../components/ErrorModal/actions'
import systemActions from '../../system/actions'

import api from './api'
import actionTypes from './actionTypes'
import storage from './storage'

/**
 * @todo: Consider token renewal.
 */
const loadStoredUser = () => (dispatch) => {
  dispatch({ type: actionTypes.LOAD_USER });
  const username = storage.getStoredUsername();
  const token = storage.getStoredToken();
  if (username !== null && token !== null) {
    api.fetchUser(username, token).then(
      (user) => {
        user.token = token;
        dispatch({ type: actionTypes.LOAD_USER_SUCCESS, user });
      },
      (error) => {
        let errMsg;
        if (error.response) {
          // The server responded with a status code that falls out of the range of 2xx.
          // For more details see: https://github.com/mzabriskie/axios#handling-errors
          if (error.response.status === 401) { // Token expired:
            storage.clearStorage();
            dispatch({ type: actionTypes.LOAD_USER_FAILED });
            return;
          }
          else {
            errMsg = `Unexpected error with status ${error.response.status}.`;
            if (error.response.data) { errMsg += ` ${error.response.data}`; }
          }
        }
        else {
          errMsg = `Unexpected error. ${error.message || error}`;
        }
        console.error(errMsg);
        dispatch(errorModalActions.showError(errMsg));
      }
    );
  }
  else {
    dispatch({ type: actionTypes.LOAD_USER_FAILED });
  }
};

/**
 * @param {string} username - The name of the user for which to fetch details.
 * @param {string} [token] The jwt-token to authenticate with. When not given, the token from the
 *        Redux store is used.
 */
const fetchUser = (username, token) => (dispatch) => {
  dispatch({
    type: actionTypes.FETCH_USER,
    username
  });
  return api.fetchUser(username, token || true).then(
    (user) => {
      console.log('>> actions/user/fetchUser > then > user:', user);
      dispatch({
        type: actionTypes.FETCH_USER_SUCCESS,
        user
      });
      return user;
    },
    (error) => {
      //console.log('api.fetchUser > catch:', error);
      let msg = error.message;
      if (error.response) {
        console.log('error.response.status:', error.response.status);
        // The request was made, but the server responded with a status code that falls out of
        // the range of 2xx (or the range set in the validateStatus config option).
        // For more details see: https://github.com/mzabriskie/axios#handling-errors
        if (error.response.status === 401) {
          // Not authenticated or token expired:
          //dispatch(logout({ showLogin: false }));
        }
        else if (error.response.status === 403) {
          console.error('Unexpected 403 when fetching user...');
          // Not authorized...
          dispatch(errorModalActions.showError('You are not authorized to access this resource.'));
        }
        else {
          console.error('error.response.data:', error.response.data);
          //let msg = `Unexpected error with status ${error.response.status}.`;
          //if (error.response.data) {
          //  msg += ` ${error.response.data}`;
          //}
          //dispatch(errorModalActions.showError(msg));
        }
        msg = `${error.response.status} ${error.response.data}`;
      }
      else {
        msg = `Unexpected error: ${error.message || error}.`;
        //dispatch(errorModalActions.showError(msg));
      }
      dispatch({
        type: actionTypes.FETCH_USER_FAILED,
        error: msg,
        username
      });
      throw error;
    }
  );
};

/**
 * @todo check if signed in ??
 * @param {string} username
 * @param {string} password
 */
const authenticate = ({ username, password }) => (dispatch) => {
  console.log('>> actions/user/authenticate(), username, password:', username, password);
  dispatch({
    type: actionTypes.AUTHORIZE_USER,
    username
  });
  api.authenticate(username, password).then(
    (user) => {
      //console.log('>> api.authenticate => user:', user);
      storage.storeUserData(user.username, user.token);
      dispatch({
        type: actionTypes.AUTHORIZE_USER_SUCCESS,
        user
      });
    },
    (error) => {
      dispatch({
        type: actionTypes.AUTHORIZE_USER_FAILED,
        username,
        error: error.message || error
      });
    }
  );
};

/**
 * Dispatch to log the user out. This action is considered to be always successful.
 */
const logout = (opts = {}) => (dispatch) => {
  const { showLogin = false, location = null } = opts;
  //console.log('>> actions/user/logout()');
  storage.clearStorage();
  dispatch(systemActions.reset());
  //dispatch(formActions.reset(FORM_MODEL));  // reset react-redux-form model and form state to initial state
  if (showLogin) {
    if (location) {
      dispatch(replace({
        pathname: '/login',
        query: { redirect: `${location.pathname}${location.search}` }
      }));
    }
    else {
      dispatch(replace({
        pathname: '/login'
      }));
    }
  }
};

export default {
  fetchUser,
  loadStoredUser,
  authenticate,
  logout
}
