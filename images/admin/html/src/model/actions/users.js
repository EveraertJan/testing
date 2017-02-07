'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import auth from 'cargo-lib/html/auth'

import actionTypes from '../actionTypes'
import api from '../api'

const invalidateUsers = (location) => (dispatch) => {
  dispatch(fetchUsers(location));
  return { type: actionTypes.INVALIDATE_USERS };
};

const fetchUsers = (location) => (dispatch, getState) => {
  dispatch({ type: actionTypes.FETCH_USERS });
  console.log(location);
  return api.fetchUsers(auth.getToken(getState())).then(
    (users) => {
      dispatch({
        type: actionTypes.FETCH_USERS_SUCCESS,
        users,
        receivedAt: new Date()
      });
    },
    (error) => {
      dispatch({ type: actionTypes.FETCH_USERS_FAILED });
      console.log(error);
    }
  );
};

export default {
  invalidateUsers,
  fetchUsers
}
