'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import actionTypes from '../actionTypes'

const sendLogSuccess = (state, { log }) => ({
  ...state,
  list: [...state.list, log]
});

const testLog = (state, { log }) => ({
  ...state,
  testing: true,
  log
})
const testLogFailed = (state, { reason }) => ({
  ...state,
  testing: false,
  reason
})
const testLogSuccess = (state) => ({
  ...state,
  testing: false
})

const fetchLogs = (state) => ({
  ...state,
  fetching: true,
  list: []
});

const fetchLogsFailed = (state, { reason }) => ({
  ...state,
  fetching: false,
  list: [],
  reason
});

const fetchLogsSuccess = (state, { logs = [] }) => ({
  ...state,
  fetching: false,
  list: logs,
  reason: null
});

const initialState = {
  fetching: false,
  testing: false,
  list: [],
  reason: null
};

export default function (state = initialState, action) {
  switch (action.type) {
    case actionTypes.SEND_LOG_SUCCESS: return sendLogSuccess(state, action);
    case actionTypes.TEST_LOGS: return testLog(state, action);
    case actionTypes.TEST_LOGS_FAILED: return testLogFailed(state, action);
    case actionTypes.TEST_LOGS_SUCCESS: return testLogSuccess(state, action);
    case actionTypes.FETCH_LOGS: return fetchLogs(state);
    case actionTypes.FETCH_LOGS_FAILED: return fetchLogsFailed(state, action);
    case actionTypes.FETCH_LOGS_SUCCESS: return fetchLogsSuccess(state, action);
    case actionTypes.RESET: return initialState;
    default:
      return state;
  }
}
