'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import { reducer as modalReducer } from 'react-redux-modal'
import { routerReducer } from 'react-router-redux'
import { reducer as formReducer } from 'redux-form'
import { combineReducers } from 'redux'

import userReducer from '../auth/users/reducers'

export default (appReducers) => {
  const duxisReducers = {
    form: formReducer,
    modals: modalReducer,
    routing: routerReducer,
    user: userReducer
  };
  Object.keys(appReducers).forEach((key) => {
    if (duxisReducers[key]) {
      throw new Error(`The keys '${[...Object.keys(duxisReducers)].join(', ')}' are forbidden for app reducers.`);
    }
  });
  return combineReducers({
    ...appReducers,
    ...duxisReducers
  });
};
