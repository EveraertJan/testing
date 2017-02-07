'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import auth from 'cargo-lib/html/auth'
import duxisActions from 'cargo-lib/html/duxis/actions'
import handleApiError from 'cargo-lib/html/utils/handleApiError'

import actionTypes from '../actionTypes'
import api from '../api'

const showUser = (username, location) => (dispatch, getState) => {
  if (!username) { throw new Error('The user name is undefined (actions/user/showUser).'); }
  const { selectedUser: { showingId } } = getState();
  if (showingId !== username) {
    dispatch({ type: actionTypes.SHOW_USER, username });
    dispatch(fetchUser(username, location));
  }
};


const fetchUser = (username, location) => (dispatch, getState) => {
  if (!username) { throw new Error('The user name is undefined (actions/user/showUser).'); }
  if (getState().selectedUser.fetchingId !== username) {
    dispatch({ type: actionTypes.FETCH_USER, username });
    api.fetchUser(username, auth.getToken(getState())).then(
      (selectedUser) => {
        if (getState().selectedUser.fetchingId !== username) { return; } // ignore stale response
        dispatch({
          type: actionTypes.FETCH_USER_SUCCESS,
          selectedUser,
          receivedAt: new Date()
        });
      },
      (error) => {
        if (getState().selectedUser.fetchingId !== username) { return; } // ignore stale response
        dispatch({
          type: actionTypes.FETCH_USER_FAILED,
          error,
          username
        });
        handleApiError(error, dispatch, location);
      }
    );
  }
};

/** Dispatched when the user deletes a user. */
const deleteUser = (username) => (dispatch, getState) => {
  if (!username) { throw new Error('The user name is undefined (actions/user/deleteuser).'); }
  const { users } = getState();

  if (users.byId[username] && users.byId[username].deleting) {
    return; // this project is already being deleted
  }

  dispatch({ type: actionTypes.DELETE_USER, username });
  api.deleteUser(username, auth.getToken(getState()))
    .then(() => {
      dispatch({
        type: actionTypes.DELETE_USER_SUCCESS,
        username
      });
    })
    .catch((error) => {
      dispatch({
        type: actionTypes.DELETE_USER_FAILED,
        username,
        error
      });
      dispatch(duxisActions.showError(error));
    });
};

const editUser = (user) => (dispatch, getState) => {
  const { users } = getState();
  if (!user || !user.username) { throw new Error('The user name is undefined (actions/user/deleteuser).'); }
  if (users.byId[user.username] && users.byId[user.username].editing) {
    return; // already being edited
  }

  dispatch({ type: actionTypes.EDIT_USER, user });
  api.updateUser(user, auth.getToken(getState()))
    .then(() => {
      dispatch({
        type: actionTypes.EDIT_USER_SUCCESS,
        user
      });
    })
    .catch((error) => {
      dispatch({
        type: actionTypes.EDIT_USER_FAILED,
        user,
        error
      });
      dispatch(duxisActions.showError(`Failed to edit user ${user.username}: ${error}`));
    });
};

///** Dispatched when the user adds a new user. */
const addUser = (user) => (dispatch, getState) => {
  api.addUser(user, auth.getToken(getState()))
    .then(() => {
      dispatch({
        type: actionTypes.ADD_USER_SUCCESS,
        user
      });
    })
    .catch((error) => {
      dispatch({
        type: actionTypes.ADD_USER_FAILED,
        user,
        error
      });
      dispatch(duxisActions.showError(`Failed to add user ${user.username}: ${error}`));
    });
};

export default {
  addUser,
  deleteUser,
  fetchUser,
  showUser,
  editUser
}
