'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import accessors from './users/accessors'
//import Auth from './Auth'
import authenticate from './authenticate'

export default {
  ...accessors,
  //Auth,
  authenticate
}
