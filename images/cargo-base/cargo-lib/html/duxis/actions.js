'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import userActions from '../auth/users/actions'
import errorModalActions from '../components/ErrorModal/actions'
import systemAction from '../system/actions'

export default {
  ...errorModalActions,
  ...systemAction,
  ...userActions
}
