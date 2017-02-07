'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import auth from 'cargo-lib/html/auth'
import Auth from 'cargo-lib/html/auth/Auth'
import React, { Component, PropTypes } from 'react'
import { Button, ButtonToolbar, PageHeader } from 'react-bootstrap';
import { Link } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { connect } from 'react-redux'

import actions from '../../model/actions/users'

class UsersPage extends Component {

  static propTypes = {
    canViewUsers: PropTypes.bool.isRequired,
    invalidateUsers: PropTypes.func.isRequired,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        username: PropTypes.string.isRequired,
        hash: PropTypes.string,
        isRoot: PropTypes.bool,
        roles: PropTypes.arrayOf(PropTypes.string)
      })
    ).isRequired
  };

  componentDidMount() {
    if (this.props.canViewUsers) {
      this.props.invalidateUsers();
    }
  }

  render() {
    const { invalidateUsers, users } = this.props;
    // console.log('- users:', users);

    const items = users.map(({ username, deleting }) => {
      if (deleting) {
        return (<li className="user-deleting" key={username}>
          <strong>{username}</strong>
        </li>);
      }
      else {
        return (<li className="user" key={username}>
          <Link to={`/users/${username}/`}><strong>{username}</strong></Link>
        </li>);
      }
    });

    return (
      <div className="content">
        <PageHeader>Users</PageHeader>
        <Auth can="duxis/view_users">
          <div>
            <div className="panel-menu">
              <ButtonToolbar>
                <Button bsStyle="primary" onClick={invalidateUsers}>Refresh</Button>
                <Auth can="duxis/manage_users">
                  <LinkContainer to="/newuser">
                    <Button bsStyle="primary">New User</Button>
                  </LinkContainer>
                </Auth>
              </ButtonToolbar>
            </div>
            <div className="user-list-div">
              <ul className="user-list">
                {items}
              </ul>
            </div>
          </div>
          <p>You are not authorized to view the users.</p>
        </Auth>
      </div>
    );
  }

}

export default connect(
  (state) => ({
    canViewUsers: auth.can(state, 'duxis/view_users'),
    users: state.users.list.map((id) => state.users.byId[id])
  }),
  (dispatch, ownProps) => ({
    invalidateUsers: () => {
      dispatch(actions.invalidateUsers(ownProps.location))
    }
  })
)(UsersPage);
