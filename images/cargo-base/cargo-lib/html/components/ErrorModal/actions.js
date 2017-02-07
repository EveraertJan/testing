'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import { isError, isString } from 'lodash'
import { modal } from 'react-redux-modal' // The modal emitter

import ErrorModal from './ErrorModal'
import actionTypes from './actionTypes'

/** Dispatch to show an error message modal. */
const showError = (error) => {
  let msg = null;
  if (isError(error)) { msg = error.message; }
  else if (isString(error)) { msg = error; }
  else { msg = error.toString(); }

  modal.add(ErrorModal, {
    title: 'Error',
    body: msg,
    size: 'small', // large, medium or small,
    closeOnOutsideClick: true,  // (optional) Switch to true if you want to close the modal by clicking outside of it,
    hideCloseButton: false // (optional) if you don't wanna show the top right close button
    //.. all what you put in here you will get access in the modal props ;)
  });
  return {
    type: actionTypes.SHOW_ERROR,
    msg
  }
};

export default {
  showError
}
