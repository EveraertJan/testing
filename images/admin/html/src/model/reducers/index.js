'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import combineDuxisReducer from 'cargo-lib/html/duxis/combineReducers'

import logsReducer from './logs'
import usersReducer from './users'
import userReducer from './user'
import rolesReducer from './roles'


export default combineDuxisReducer({
  logs: logsReducer,
  users: usersReducer,
  selectedUser: userReducer,
  roles: rolesReducer
});
