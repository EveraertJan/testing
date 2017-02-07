'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import auth from 'cargo-lib/html/auth'
import Auth from 'cargo-lib/html/auth/Auth'
import LoginPage from 'cargo-lib/html/auth/LoginPage'
import userActions from 'cargo-lib/html/auth/users/actions'
import NotFound from 'cargo-lib/html/components/NotFound'
import config from 'cargo-lib/html/system/config'
import request from 'cargo-lib/html/system/request'
import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { Nav, Navbar, NavItem } from 'react-bootstrap'
import { connect, Provider } from 'react-redux'
import ReduxModal from 'react-redux-modal'
import { Router, browserHistory } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { routerMiddleware, syncHistoryWithStore } from 'react-router-redux'
import { applyMiddleware, createStore } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import createLogger from 'redux-logger'
import promiseMiddleware from 'redux-promise'
import thunkMiddleware from 'redux-thunk'

import rootReducer from './model/reducers/index'
import About from './sections/about/About'
import LogsSection from './sections/logs/LogsSection'
import UsersPage from './sections/users/UsersPage'
import UserPage from './sections/users/UserPage'
import NewUserPage from './sections/users/NewUserPage'

// Import index.html such that it is also copied to the html (dist) folder.
import 'file?name=[name].[ext]!./index.html'

class App extends React.Component {

  static propTypes = {
    authenticated: PropTypes.bool.isRequired,
    children: PropTypes.object,  // eslint-disable-line react/forbid-prop-types
    loadStoredUser: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { navExpanded: false };
  }

  componentDidMount() {
    this.props.loadStoredUser();
  }

  handleNavbarToggle() {
    this.setState({ navExpanded: !this.state.navExpanded });
  }

  render() {
    const { authenticated } = this.props;
    return (
      <div className="page">
        <Navbar
          fixedTop
          fluid
          onClick={() => this.handleNavbarToggle()}
          defaultExpanded={false}
          expanded={this.state.navExpanded}
          onToggle={() => {}}
        >
          <Navbar.Header>
            <Navbar.Brand><a href="#">{config.soyl.projectName} Admin</a></Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>

          <Navbar.Collapse>
            <Nav>
              <Auth can="wijze_stad/view_logs">
                <LinkContainer to="/logs">
                  <NavItem eventKey={1}>Logs</NavItem>
                </LinkContainer>
              </Auth>
              <Auth can="duxis/view_users">
                <LinkContainer to="/users">
                  <NavItem eventKey={4}>Users</NavItem>
                </LinkContainer>
              </Auth>
              <LinkContainer to="/about">
                <NavItem eventKey={5}>About</NavItem>
              </LinkContainer>
              <LinkContainer to={authenticated ? '/login?logout=true' : '/login'}>
                <NavItem eventKey={5}>{authenticated ? 'Logout' : 'Login'}</NavItem>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>

        </Navbar>
        {this.props.children}
        <footer><div className="footer">©2016, imec.livinglabs</div></footer>
      </div>
    );
  }

}

const mapStateToProps = (state) => ({
  authenticated: auth.isAuthenticated(state),
  username: auth.getUsername(state)
});

const mapDispatchToProps = {
  loadStoredUser: userActions.loadStoredUser
};

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App);

// Enable Redux Devtools as browser extension:
const composeEnhancers = composeWithDevTools({
  // Specify here name, actionsBlacklist, actionsCreators and other options
  actionsBlacklist: [
    'redux-form/BLUR',
    'redux-form/CHANGE',
    'redux-form/DESTROY',
    'redux-form/FOCUS',
    'redux-form/REGISTER_FIELD',
    'redux-form/TOUCH'
  ]
});

// Create the Redux store and use the react-redux' Provider to share it with the components.
const store = createStore(
  rootReducer,
  composeEnhancers(
    applyMiddleware(
      thunkMiddleware,
      promiseMiddleware,
      createLogger(),
      routerMiddleware(browserHistory)
    )
  )
);

request.initialize(store);

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./model/reducers', () => {
    store.replaceReducer(rootReducer);  // eslint-disable-line import/newline-after-import
  });
}

// Create an enhanced history that syncs navigation events with the store
const history = syncHistoryWithStore(browserHistory, store);

const routes = {
  path: '/',
  component: AppContainer,
  indexRoute: { component: About },
  childRoutes: [
    { path: 'about', component: About },
    { path: 'login', component: LoginPage },
    { path: 'logs', component: auth.authenticate(LogsSection) },
    { path: 'users', component: auth.authenticate(UsersPage) },
    { path: 'users/:username', component: auth.authenticate(UserPage) },
    { path: 'newuser', component: auth.authenticate(NewUserPage) },
    { path: '*', component: NotFound }
  ]
};

ReactDOM.render((
  <Provider store={store}>
    <div>
      <Router history={history} routes={routes} />
      <ReduxModal />
    </div>
  </Provider>
), document.getElementById('body'));
