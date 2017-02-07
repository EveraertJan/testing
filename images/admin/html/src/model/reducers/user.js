'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import { isUndefined } from 'lodash'

import actionTypes from '../actionTypes'

function showUser(state, { username }) {
  return {
    ...state,
    showing: null,
    showingId: username
  };
}

function fetchUser(state, { username }) {
  // console.log('>> reducers/project/fetchUser()', state);
  return {
    ...state,
    fetchError: null,
    fetching: true,
    fetchingId: username
  };
}

function fetchUserSuccess(state, { selectedUser }) {
  // console.log('>> reducers/project/fetchUserSuccess()', state, selectedUser);
  // console.log('new state', {...state, showing: selectedUser, fetching: false});
  return {
    ...state,
    showing: selectedUser,
    fetching: false
  };
}

function fetchUserError(state, { error }) {
  //console.log('>> reducers/project/fetchProjectError()', state, error);
  return {
    ...state,
    fetchError: error,
    fetching: false
  };
}

function deleteUserSuccess(state, { username }) {
  //console.log('>> reducers/project/deleteProjectSucces()', state, action);
  if (state.showingId === username) {
    return {
      ...state,
      showing: null
    };
  }
  else {
    return state;
  }
}

function editUserSuccess(state, { user }) {
  if (state.showingId === user.username) {
    return {
      ...state,
      showing: { ...user }
    };
  }
  else {
    return state;
  }
}

const initialState = {
  fetchError: null,
  fetching: false,
  fetchingId: null,
  showing: null,
  showingId: null
};

export default function reducer(state = initialState, action) {
  if (isUndefined(action)) {
    throw new Error('The action parameter is undefined.');
  }
  if (isUndefined(action.type)) {
    throw new Error('The type property of the action parameter is undefined.');
  }
  //console.log('- action:', action);
  switch (action.type) {
    case actionTypes.DELETE_USER_SUCCESS: return deleteUserSuccess(state, action);
    case actionTypes.EDIT_USER_SUCCESS: return editUserSuccess(state, action);
    case actionTypes.FETCH_USER: return fetchUser(state, action);
    case actionTypes.FETCH_USER_FAILED: return fetchUserError(state, action);
    case actionTypes.FETCH_USER_SUCCESS: return fetchUserSuccess(state, action);
    case actionTypes.RESET: return initialState;
    case actionTypes.SHOW_USER: return showUser(state, action);
    default:
      //console.log('>> reducers > esm.projects - unhandled action.type:', action.type);
      //console.log('- state:', state);
      //console.log('- action:', action);
      return state;
  }
}
