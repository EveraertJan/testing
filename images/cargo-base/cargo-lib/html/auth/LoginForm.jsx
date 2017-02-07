'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import React, { PropTypes } from 'react'
//import { Button, ControlLabel, FormGroup, PageHeader, Panel } from 'react-bootstrap'
import { Field, reduxForm } from 'redux-form'

//function isRequired(val) {
//  return val && val.length > 0;
//}

const Form = (props) => (
  <form onSubmit={props.handleSubmit}>
    <div>
      <label htmlFor="username">Username</label>
      <Field name="username" component="input" type="text" />
    </div>
    <div>
      <label htmlFor="password">Password</label>
      <Field name="password" component="input" type="password" />
    </div>
    <button type="submit">Sign in...</button>
  </form>
);

Form.propTypes = {
  handleSubmit: PropTypes.func.isRequired
};

export default reduxForm({
  form: 'login'
})(Form);
