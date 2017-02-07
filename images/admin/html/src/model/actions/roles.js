'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import auth from 'cargo-lib/html/auth'
import duxisActions from 'cargo-lib/html/duxis/actions'

import actionTypes from '../actionTypes'
import api from '../api'

const getRoles = () => (dispatch, getState) => {
  dispatch({ type: actionTypes.FETCH_ROLES });
  api.fetchRoles(auth.getToken(getState())).then(
    (roles) => {
      dispatch({
        type: actionTypes.FETCH_ROLES_SUCCESS,
        roles,
        receivedAt: new Date()
      })
    },
    (error) => {
      dispatch({
        type: actionTypes.FETCH_ROLES_FAILED,
        error
      });
      dispatch(duxisActions.showError('Failed to retrieve different roles'));
    }
  );
};

export default {
  getRoles
}
