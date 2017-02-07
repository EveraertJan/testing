'use strict';

import { isUndefined } from 'lodash'

import actionTypes from '../actionTypes'

function fetchRoles(state) {
  return {
    ...state,
    fetching: true
  }
}

function fetchRolesSuccess(state, { roles }) {
  console.log(roles);
  const roleNames = roles.map(role => role.name);
  console.log(roleNames);
  return {
    ...state,
    fetching: false,
    list: roleNames
  };
}

function fetchRolesError(state, { error }) {
  return {
    ...state,
    fetchError: error,
    fetching: false
  }
}

const initialState = {
  fetching: false,
  list: []
};

export default function reducer(state = initialState, action) {
  if (isUndefined(action)) {
    throw new Error('The action parameter is undefined.');
  }
  if (isUndefined(action.type)) {
    throw new Error('The type property of the action parameter is undefined.');
  }
  switch (action.type) {
    case actionTypes.FETCH_ROLES: return fetchRoles(state, action);
    case actionTypes.FETCH_ROLES_FAILED: return fetchRolesError(state, action);
    case actionTypes.FETCH_ROLES_SUCCESS: return fetchRolesSuccess(state, action);
    case actionTypes.RESET: return initialState;
    default:
      return state;
  }
}
