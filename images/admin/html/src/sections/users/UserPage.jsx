'use strict';

/**
 * @copyright 2016, imec v.z.w.
 */

import React, { Component, PropTypes } from 'react'
import { Button, ButtonToolbar, PageHeader } from 'react-bootstrap'
import { connect } from 'react-redux'
import { routerActions } from 'react-router-redux'
import Auth from 'cargo-lib/html/auth/Auth'

import actions from '../../model/actions/user'
import roleActions from '../../model/actions/roles'

import UserForm from './UserForm'

class UserPage extends Component {

  static propTypes = {
    deleteUser: PropTypes.func.isRequired,
    deleting: PropTypes.bool,
    editUser: PropTypes.func.isRequired,
    editing: PropTypes.bool,
    error: PropTypes.string,
    fetching: PropTypes.bool,
    fetchingId: PropTypes.string,
    getRoles: PropTypes.func.isRequired,
    goToUsers: PropTypes.func,
    params: PropTypes.shape({
      username: PropTypes.string
    }),
    roles: PropTypes.arrayOf(PropTypes.string),
    showUser: PropTypes.func.isRequired,
    showingId: PropTypes.string,
    user: PropTypes.shape({
      username: PropTypes.string.isRequired,
      isRoot: PropTypes.bool,
      roles: PropTypes.arrayOf(PropTypes.string)
    })
  };

  constructor(props) {
    super(props);
    this.handleEditUser = this.handleEditUser.bind(this);
  }

  componentDidMount() {
    this.props.getRoles();
    this.props.showUser();
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.user && !nextProps.fetching) {
      this.props.goToUsers();
    }
  }

  shouldComponentUpdate(nextProps) {
    return (this.props.showingId !== nextProps.showingId || this.props.user !== nextProps.user || this.props.roles !== nextProps.roles);
  }

  handleEditUser() {
    this.props.editUser();
  }

  render() {
    const { deleteUser, deleting, fetching, user } = this.props;
    if (fetching) {
      return (
        <div className="content">
          <PageHeader>User: ...</PageHeader>
          <p>Loading user details...</p>
        </div>
      );
    }
    else if (user) {
      const { username, isRoot, roles } = user;
      console.log(roles);
      return (
        <div className="content">
          <PageHeader>User: {username}</PageHeader>
          {deleting ? <div className="warning">This user is being deleted...</div> : null}
          <Auth can="duxis/manage_users">
            <div>
              <UserForm onSubmit={this.handleEditUser} roles={this.props.roles} user={user} buttonText="Save" />
              {deleting ? null :
                (<div className="panel-menu">
                  <ButtonToolbar>
                    <Button bsStyle="primary" onClick={deleteUser}>Delete</Button>
                  </ButtonToolbar>
                  <hr />
                </div>)
              }
            </div>
            {/** next auth elem is like an else statement **/}
            <Auth can="duxis/view_users">
              <div>
                <p>Name: {username}</p>
                <p>isRoot: {isRoot.toString()}</p>
                <p>Roles:</p>
                <ul>
                  {roles.map(role => (<li className="role" key={role}>{role}</li>))}
                </ul>
                {/** For now don't display activities, since they are not displayed in the edit view either**/}
                {/**<p>Activities:</p>
                <ul>
                  {activities.map(activity => (<li className="activity" key={activity}>{activity}</li>))}
                </ul> **/}
              </div>
            </Auth>
          </Auth>
        </div>
      );
    }
    else  {
      return (
        <div className="content">
          <p>TODO...</p>
        </div>
      );
    }
  }

}

const mapStateToProps = (state) => {
  const { selectedUser: { error, fetching, fetchingId, showing, showingId }, users: { byId } } = state;
  return {
    deleting: Boolean(byId[showingId] && byId[showingId].deleting),
    editing: Boolean(byId[showingId] && byId[showingId].editing),
    error,
    fetching: fetching || state.roles.fetching,
    fetchingId,
    user: showing,
    roles: state.roles.list
  }
};

const mapHandlersToProps = (dispatch, ownProps) => ({
  showUser: () => dispatch(actions.showUser(ownProps.params.username, ownProps.location)),
  deleteUser: () => dispatch(actions.deleteUser(ownProps.params.username, ownProps.location)),
  editUser: (values) => dispatch(actions.editUser(values)),
  getRoles: () => dispatch(roleActions.getRoles()),
  goToUsers: () => dispatch(routerActions.replace('/users'))
});

export default connect(mapStateToProps, mapHandlersToProps)(UserPage);
