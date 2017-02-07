'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import userActions from './user'
import usersActions from './users'
import rolesActions from './roles'
import logsActions from './logs'

export default {
  ...userActions,
  ...usersActions,
  ...rolesActions,
  ...logsActions
}
