'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import auth from 'cargo-lib/html/auth'
import Auth from 'cargo-lib/html/auth/Auth'
import config from 'cargo-lib/html/system/config'
import React, { PropTypes } from 'react'
import { PageHeader, Panel } from 'react-bootstrap'
import { connect } from 'react-redux'

import ToolsPanel from '../../components/ToolsPanel'

function About({ activities, authenticated, username }) {
  return (
    <div className="content about-section">
      <PageHeader>About {config.soyl.projectName} Server</PageHeader>

      {authenticated ? (
        <Panel header="User Details">
          <p>Welcome <emph>{username}</emph>.</p>
          <p>You are authorized to perform the following activities:</p>
          <ul>{activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
        </Panel>
      ) : null}

      <Panel>
        <p>The {config.soyl.projectName} server is developed by the <emph >Digital Research Engineers</emph> at <emph>imec.livinglabs</emph>.</p>
        <p>The principal developers are:</p>
        <ul>
          <li>Wouter Van den Broeck</li>
          <li>Louis Rigot</li>
          <li>Jan Everaert</li>
        </ul>
        <hr />
        <p>Version: { config.soyl.version }</p>
      </Panel>

      <Panel header="Demos">
        <h2>Auth tests</h2>
        <ul>
          <li><Auth can="duxis/view_users">You can view users</Auth></li>
          <li>You <Auth can="duxis/manage_users"><span>can</span><span>cannot</span></Auth> manage users</li>
          <li>You <Auth can="manage_foo"><span>can</span><span>cannot</span></Auth> manage foo</li>
          <Auth can="duxis/view_users duxis/manage_users">
            <li>You can view & manage users</li>
            <li>You cannot view & manage users</li>
          </Auth>
          <Auth can="duxis/view_users manage_foo">
            <li>You can view users & manage foo</li>
            <li>You cannot view users & manage foo</li>
          </Auth>
        </ul>
      </Panel>

      <Auth can="duxis/manage_system">
        <ToolsPanel />
      </Auth>
    </div>
  );
}

About.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.string.isRequired
  ),
  authenticated: PropTypes.bool.isRequired,
  username: PropTypes.string
};

const mapStateToProps = (state) => ({
  activities: state.user.activities,
  authenticated: auth.isAuthenticated(state),
  username: auth.getUsername(state)
});

export default connect(mapStateToProps)(About);
