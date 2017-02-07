'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import React, { Component, PropTypes } from 'react'
import { PageHeader, Panel } from 'react-bootstrap'
import { connect } from 'react-redux'
//import { Field, Form, Errors } from 'react-redux-form'
import { routerActions } from 'react-router-redux'
import ReactSpinner from 'react-spinjs'

import LoginForm from './LoginForm'
import userActions from './users/actions'
import accessors from './users/accessors'

class LoginPage extends Component {

  static propTypes = {
    authenticate: PropTypes.func.isRequired,
    authenticated: PropTypes.bool.isRequired,
    authenticating: PropTypes.bool.isRequired,
    authenticationFailed: PropTypes.bool.isRequired,
    error: PropTypes.string,
    location: PropTypes.object,  // eslint-disable-line react/forbid-prop-types
    logout: PropTypes.func.isRequired,
    redirect: PropTypes.string.isRequired,
    replace: PropTypes.func.isRequired
  };

  componentWillMount() {
    //console.log('>> LoginPage.componentWillMount()');
    const { authenticated, location: { query }, logout, redirect, replace } = this.props;
    //console.log('- authenticated:', authenticated);
    //console.log('- query.logout:', query.logout);
    if (authenticated) {
      if (query && query.logout === 'true') {
        //console.log('> componentWillMount > authenticated > logout...');
        logout();
      }
      else {
        //console.log('> componentWillMount > authenticated > redirect:', redirect);
        replace(redirect);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { authenticated, replace, redirect } = nextProps;
    const { authenticated: wasAuthenticated } = this.props;

    if (!wasAuthenticated && authenticated) {
      //console.log('>> componentWillReceiveProps > authenticated! - redirect:', redirect);
      replace(redirect)
    }
  }

  shouldComponentUpdate() {
    return true;
  }

  render() {
    const { authenticate, authenticating, authenticationFailed, error } = this.props;
    return (
      <div className="content">
        <PageHeader>Authenticate</PageHeader>
        <Panel>
          {authenticationFailed ? <div className="login-failed">Login failed. {error}</div> : null}

          <LoginForm onSubmit={authenticate} />

          {authenticating ? <ReactSpinner /> : null}
        </Panel>
      </div>
    );
  }
}

const mapStateToProps = (state, { location }) => ({
  authenticated: accessors.isAuthenticated(state),
  authenticating: accessors.isAuthenticating(state),
  authenticationFailed: accessors.authenticationFailed(state),
  error: accessors.getAuthenticationError(state),
  redirect: (location && location.query && location.query.redirect) || '/'
});

const mapDispatchToProps = (dispatch) => ({
  authenticate: (values) => dispatch(userActions.authenticate(values)),
  logout: () => dispatch(userActions.logout()),
  replace: (route) => dispatch(routerActions.replace(route))
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage);
