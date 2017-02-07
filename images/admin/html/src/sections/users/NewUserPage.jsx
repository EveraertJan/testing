'use strict';

import React, { Component, PropTypes } from 'react'
import { PageHeader } from 'react-bootstrap'
import { connect } from 'react-redux'
import { reset } from 'redux-form'
import Auth from 'cargo-lib/html/auth/Auth'

import userActions from '../../model/actions/user'
import roleActions from '../../model/actions/roles'

import UserForm from './UserForm'

class NewUserPage extends Component {
  static propTypes = {
    createUser: PropTypes.func,
    fetching: PropTypes.bool,
    getRoles: PropTypes.func,
    roles: PropTypes.arrayOf(PropTypes.string)
  };

  constructor(props) {
    super(props);
    this.handleCreateUser = this.handleCreateUser.bind(this);
  }

  componentDidMount() {
    this.props.getRoles();
  }

  shouldComponentUpdate() {
    return true;
  }

  handleCreateUser() {
    this.props.createUser();
  }

  render() {
    return (
      <div className="content">
        <PageHeader>Add User</PageHeader>
        <Auth can="duxis/manage_users">
          <UserForm onSubmit={this.handleCreateUser} roles={this.props.roles} buttonText="Create" />
        </Auth>
      </div>
    );
  }
}

const mapHandlersToProps = (dispatch) => ({
  createUser: (values) => {
    dispatch(userActions.addUser(values));
    dispatch(reset('newuser'));
  },
  getRoles: () => dispatch(roleActions.getRoles())
});

const mapStateToProps = state => {
  return {
    roles: state.roles.list,
    fetching: state.roles.fetching
  }
}


export default connect(mapStateToProps, mapHandlersToProps)(NewUserPage);
