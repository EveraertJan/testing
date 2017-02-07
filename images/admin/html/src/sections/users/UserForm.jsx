'use strict';

import React, { Component, PropTypes } from 'react'
import { Field, reduxForm } from 'redux-form';

class UserForm extends Component {

  static propTypes = {
    buttonText: PropTypes.string.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    initialize: PropTypes.func,
    roles: PropTypes.arrayOf(PropTypes.string),
    user: PropTypes.shape({
      username: PropTypes.string,
      isRoot: PropTypes.bool,
      roles: PropTypes.arrayOf(PropTypes.string)//,
      //activities: PropTypes.arrayOf(PropTypes.string)
    })
  };

  componentDidMount() {
    this.handleInitialize();
  }

  // form initialization
  handleInitialize() {
    if (this.props.user) {
      const initData = {
        username: this.props.user.username,
        isRoot: this.props.user.isRoot,
        roles: this.props.user.roles
      };
      this.props.initialize(initData);
    }
  }

  render() {
    return (
      <form onSubmit={this.props.handleSubmit}>
        <div>
          <label htmlFor="username">User Name</label>
          <Field name="username" component="input" type="text" readOnly={this.props.user} />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <Field name="password" component="input" type="password" />
        </div>
        <div>
          <label htmlFor="isRoot">isRoot</label>
          <Field name="isRoot" component="input" type="checkbox" />
        </div>
        <div>
          <Field name="roles" component="select" multiple type="select-multiple">
            {this.props.roles.map(role => (<option value={role} key={role}>{role}</option>)) }
          </Field>
        </div>
        <button type="submit">{this.props.buttonText}</button>
      </form>
    );
  }
}

export default reduxForm({
  form: 'newuser'
})(UserForm);
