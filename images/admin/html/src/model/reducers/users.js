'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import { defaults, isArray, isUndefined, omit, pick } from 'lodash'

import actionTypes from '../actionTypes'

function invalidateUsers(state) {
  return {
    ...state,
    invalid: true
  };
}

function fetchUsers(state) {
  return {
    ...state,
    fetching: true
  };
}

function fetchUsersSuccess(state, action) {
  //console.log('>> reducers/projects/fetchProjectsSuccess()');
  const byId = {};
  if (isArray(action.users)) {
    action.users.forEach((user) => {
      user = pick(user, ['username', 'roles']);
      user = defaults(user, state.byId[user.username]);
      byId[user.username] = user;
    });
    return {
      ...state,
      byId,
      list: action.users.map((user) => user.username),
      fetching: false,
      invalid: false,
      lastUpdated: action.receivedAt
    };
  }
  else {
    console.error('action.users is empty - action:', action);
    return state;
  }
}

function fetchUsersFailed(state) {
  return {
    ...state,
    fetching: false
  };
}

function deleteUser(state, { id }) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [id]: {
        ...state.byId[id],
        deleting: true
      }
    },
    invalid: true
  };
}

function editUser(state, { user }) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [user.username]: {
        ...state.byId[user.username],
        editing: true
      }
    },
    invalid: true
  };
}

function deleteUserSuccess(state, { id }) {
  return {
    ...state,
    byId: omit(state.byId, id),
    invalid: false
  };
}

function editUserSuccess(state, { user }) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [user.username]: {
        ...user,
        editing: false
      }
    },
    invalid: false
  };
}

function addUserSuccess(state, { user }) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [user.username]: { ...user }
    },
    invalid: false
  };
}

function deleteUserError(state, { id }) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [id]: {
        ...state.byId[id],
        deleting: false
      }
    },
    invalid: true
  };
}

function editUserFailed(state, { user }) {
  return {
    ...state,
    byId: {
      ...state.byId,
      [user.username]: {
        ...state.byId[user.username],
        editing: false
      }
    },
    invalid: true
  };
}

const initialState = {
  byId: {},
  list: [],
  fetching: false,
  invalid: false,
  lastUpdated: null,
  newUser: {
    title: 'New User'
  }
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
    case actionTypes.DELETE_USER: return deleteUser(state, action);
    case actionTypes.DELETE_USER_FAILED: return deleteUserError(state, action);
    case actionTypes.DELETE_USER_SUCCESS: return deleteUserSuccess(state, action);
    case actionTypes.EDIT_USER: return editUser(state, action);
    case actionTypes.EDIT_USER_FAILED: return editUserFailed(state, action);
    case actionTypes.EDIT_USER_SUCCESS: return editUserSuccess(state, action);
    case actionTypes.ADD_USER_SUCCESS: return addUserSuccess(state, action);
    case actionTypes.FETCH_USERS: return fetchUsers(state);
    case actionTypes.FETCH_USERS_SUCCESS: return fetchUsersSuccess(state, action);
    case actionTypes.FETCH_USERS_FAILED: return fetchUsersFailed(state, action);
    case actionTypes.INVALIDATE_USERS: return invalidateUsers(state);
    case actionTypes.RESET: return initialState;
    default:
      return state;
  }
}
