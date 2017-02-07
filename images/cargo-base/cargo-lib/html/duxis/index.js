'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import actions from './actions'
import actionTypes from './actionTypes'
import combineReducers from './combineReducers'

export default {
  ...actionTypes,
  combineReducers
}
