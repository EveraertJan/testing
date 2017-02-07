'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import userActionTypes from '../auth/users/actionTypes'
import errorModalActionTypes from '../components/ErrorModal/actionTypes'
import systemActionTypes from '../system/actionTypes'

export default {
  ...userActionTypes,
  ...errorModalActionTypes,
  ...systemActionTypes
}
