'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import { isUndefined } from 'lodash'

import actionTypes from './actionTypes'

const loadStoredUser = () => ({
  ...initialState,
  authenticating: false,
  loadingStoredUser: true,
  username: null
});

const loadStoredUserSuccess = (state, { user }) => {
  if (state.loadingStoredUser) {
    return {
      ...state,
      activities: user.activities,
      authenticated: true,
      isRoot: user.isRoot,
      loadingStoredUser: false,
      roles: user.roles,
      token: user.token,
      username: user.username
    }
  }
  return state;
};

const loadStoredUserFailed = (state) => {
  if (state.loadingStoredUser) {
    return {
      ...state,
      loadingStoredUser: false
    }
  }
  return state;
};

//const fetchUserSuccess = (state, { activities, roles, username }) => ({
//  ...state,
//  activities,
//  roles,
//  username
//});

const authenticateUser = (state, { username }) => ({
  ...initialState,
  authenticating: true,
  loadingStoredUser: false,
  username
});

const authenticateUserFailed = (state, { error, username }) => {
  if (state.authenticating && state.username === username) {
    return {
      ...state,
      authenticating: false,
      authenticationFailed: true,
      error
    };
  }
  return state;
};

const authenticateUserSuccess = (state, { user }) => {
  if (state.authenticating && state.username === user.username) {
    return {
      ...state,
      activities: user.activities,
      authenticated: true,
      authenticating: false,
      isRoot: user.isRoot,
      roles: user.roles,
      token: user.token,
      username: user.username
    }
  }
  return state;
};

const initialState = {
  activities: [],
  authenticated: false,
  authenticating: false,
  authenticationFailed: false,
  error: null,
  isRoot: false,
  loadingStoredUser: false,
  roles: [],
  token: null,
  username: null
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
    //case actionTypes.FETCH_USER_SUCCESS: return fetchUserSuccess(state, action);

    case actionTypes.LOAD_USER: return loadStoredUser(state, action);
    case actionTypes.LOAD_USER_SUCCESS: return loadStoredUserSuccess(state, action);
    case actionTypes.LOAD_USER_FAILED: return loadStoredUserFailed(state, action);

    case actionTypes.AUTHORIZE_USER: return authenticateUser(state, action);
    case actionTypes.AUTHORIZE_USER_FAILED: return authenticateUserFailed(state, action);
    case actionTypes.AUTHORIZE_USER_SUCCESS: return authenticateUserSuccess(state, action);

    case actionTypes.RESET: return initialState;
    default:
      //console.log('>> reducers/user - unhandled action.type:', action.type);
      //console.log('- state:', state);
      //console.log('- action:', action);
      return state;
  }
}
