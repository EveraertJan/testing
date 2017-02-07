'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import auth from 'cargo-lib/html/auth'
import handleApiError from 'cargo-lib/html/utils/handleApiError'
import extractReason from 'cargo-lib/html/utils/extractReason'

import actionTypes from '../actionTypes'
import api from '../api'

const sendLog = (log) => (dispatch, getState) => {
  console.log('>> addLog > log:', log);
  dispatch({
    type: actionTypes.SEND_LOG,
    log
  });
  api.sendLog(log, auth.getToken(getState())).then(
    (response) => dispatch({
      type: actionTypes.SEND_LOG_SUCCESS,
      log
    }),
    (error) => {
      dispatch({
        type: actionTypes.SEND_LOG_FAILED,
        reason: extractReason(error),
        log
      });
    }
  )
};

const fetchLogs = () => (dispatch, getState) => {
  dispatch({
    type: actionTypes.FETCH_LOGS
  });
  api.fetchLogs(auth.getToken(getState())).then(
    (logs) => dispatch({
      type: actionTypes.FETCH_LOGS_SUCCESS,
      logs
    }),
    (error) => {
      dispatch({
        type: actionTypes.FETCH_LOGS_FAILED,
        reason: extractReason(error)
      });
      handleApiError(error, dispatch);
    }
  );
};

const testLogs = () => (dispatch, getState) => {
  dispatch({
    type: actionTypes.TEST_LOG
  });
  api.testLog(auth.getToken(getState())).then(
    () => dispatch({
      type: actionTypes.TEST_LOG_SUCCESS
    }),
    (error) => {
      dispatch({
        type: actionTypes.TEST_LOG_FAILED,
        reason: extractReason(error)
      });
    }
  );
};


export default {
  sendLog,
  fetchLogs,
  testLogs
}
