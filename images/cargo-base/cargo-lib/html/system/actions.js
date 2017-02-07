'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import actionTypes from './actionTypes'

/** Dispatch to reset all state to the initial state. */
const reset = () => ({ type: actionTypes.RESET });

export default {
  reset
}
