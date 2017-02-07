'use strict';

/**
 * Derived from https://github.com/mjrussell/redux-auth-wrapper
 *
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import hoistStatics from 'hoist-non-react-statics'
import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { routerActions } from 'react-router-redux'
//import ReactSpinner from 'react-spinjs'

import accessors from './users/accessors'

/**
 * Returns a component that 'wraps' the given component. The resulting component checks if the user
 * is authenticated. When the user is not authenticated, then the user is redirected to `/login/`.
 * When the user is properly authenticated, then the wrapped component is rendered. This component
 * receives as props all props the wrapper component received, including a history
 * [location](https://github.com/mjackson/history/blob/v2.x/docs/Location.md), but excluding
 * `isAuthenticated`, `isAuthenticating` and `redirect`.
 *
 * @param {function} WrappedComponent - The component to wrap.
 */
export default function authenticate(WrappedComponent) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  /**
   * See above.
   */
  class Wrapper extends Component {

    static displayName = `Authenticating(${displayName})`;

    static propTypes = {
      isAuthenticated: PropTypes.bool.isRequired,
      isAuthenticating: PropTypes.bool.isRequired,
      location: PropTypes.shape({
        action: PropTypes.string.isRequired,
        key: PropTypes.string.isRequired,
        pathname: PropTypes.string.isRequired,
        search: PropTypes.string.isRequired,
        state: PropTypes.object  // eslint-disable-line react/forbid-prop-types
      }),
      redirect: PropTypes.func.isRequired
    };

    componentWillMount() {
      if (!this.props.isAuthenticating && !this.props.isAuthenticated) {
        this.props.redirect(this.props.location);
      }
    }

    componentWillReceiveProps(nextProps) {
      if (!nextProps.isAuthenticated && !nextProps.isAuthenticating) {
        nextProps.redirect(nextProps.location);
      }
    }

    shouldComponentUpdate(nextProps) {
      return (
           this.props.isAuthenticated !== nextProps.isAuthenticated
        || this.props.isAuthenticating !== nextProps.isAuthenticating
      );
    }

    render() {
      const { isAuthenticated, isAuthenticating, redirect, ...otherProps } = this.props; // eslint-disable-line no-unused-vars
      if (isAuthenticated) {
        return (<WrappedComponent {...otherProps} />);
      }
      else if (isAuthenticating) {
        return (<p>Authenticating, please wait...</p>);
      }
      else { return null; }
    }

  }

  const mapStateToProps = (state) => ({
    isAuthenticated: accessors.isAuthenticated(state),
    isAuthenticating: accessors.isAuthenticating(state)
  });

  const mapDispatchToProps = (dispatch) => ({
    redirect: (location) => dispatch(routerActions.replace({
      pathname: '/login',
      query: { redirect: `${location.pathname}${location.search}` }
    }))
  });

  const ConnectedWrapper = connect(mapStateToProps, mapDispatchToProps)(Wrapper);
  return hoistStatics(ConnectedWrapper, WrappedComponent)
}

/**
 * TODO: This function was provided in redux-auth-wrapper, but it is unclear what purpose it serves
 * and whether it is even called. To determine this, I made it throw an error... [woutervdbr]
 *
 * authenticate.onEnter = (store, nextState, replace) => {
 */
authenticate.onEnter = () => {
  console.error('>> authenticate.onEnter()');
  throw new Error('>> authenticate.onEnter()');
  //if (!accessors.isAuthenticated(store.getState())) {
  //  redirect(nextState.location, replace)
  //}
};

//function redirect(location, redirectFn) {
//  redirectFn({
//    pathname: '/login',
//    query: { redirect: `${location.pathname}${location.search}` }
//  });
//}
