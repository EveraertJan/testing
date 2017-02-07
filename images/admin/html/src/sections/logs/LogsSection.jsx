'use strict';

/**
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

//import auth from 'cargo-lib/html/auth'
import Auth from 'cargo-lib/html/auth/Auth'
import React from 'react'
import { PageHeader, Panel } from 'react-bootstrap'
import { connect } from 'react-redux'

import LogItemsList from './LogItemsList'
import LogReportForm from './LogReportForm'
import ASMTesters from './ASMTesters'

function Logs() {
  return (
    <Auth can="wijze_stad/view_logs">
      <div className="content">
        <PageHeader>Logs</PageHeader>
        <Auth can="fogg/manage_logs">
          <div>
            <h2>Manual Log Submission</h2>
            <Panel>
              <LogReportForm />
            </Panel>
          </div>
        </Auth>

        <Auth can="wijze_stad/view_logs">
          <div>
            <h2>ASM Testers</h2>
            <Panel>
              <ASMTesters />
            </Panel>
          </div>
          <h2>Activity Log Stream</h2>
          <Panel>
            <LogItemsList />
          </Panel>
          <div className="content">
            <p>You are not authorized to view the ESM logs.</p>
          </div>
        </Auth>
      </div>
    </Auth>
  );
}

/*
*/

const mapStateToProps = () => ({
  //canViewRewards: auth.can(state, 'fogg/view_rewards')
  //rules: state.rules.list,
  //reason: state.rules.reason
});

const mapDispatchToProps = {
  //fetchRewards: actions.fetchRewards
  //updateReward: actions.updateReward
};

export default connect(mapStateToProps, mapDispatchToProps)(Logs);
