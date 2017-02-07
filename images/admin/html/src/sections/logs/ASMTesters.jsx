'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Button, ButtonGroup } from 'react-bootstrap'

import logActions from '../../model/actions/logs'

const CLIENT_ID = 'mupets-admin';

class ASMTesters extends Component {

  static propTypes = {
    sendLog: PropTypes.func,
    testLogs: PropTypes.func,
    user: PropTypes.shape({
      username: PropTypes.string.isRequired,
      isRoot: PropTypes.bool,
      roles: PropTypes.arrayOf(PropTypes.string)
    })
  }

  constructor(props) {
    super(props);
    this.submitLog = this.submitLog.bind(this);
    this.testLogService = this.testLogService.bind(this);
  }

  submitLog(payload) {
    const { user } = this.props;
    const { username, isRoot, roles } = user;
    const event = {
      timestamp: new Date().getTime(),
      type: 'test.002',
      count: 1,
      payload
    };
    const report = {
      client: CLIENT_ID,
      user: username,
      platform: 'web',
      events: [event]
    };
    this.props.sendLog(report)
  }

  testLogService() {
    this.props.testLogs();
  }
  render() {
    return (
      <div>
        <ButtonGroup style={{ paddingBottom: '7.5px' }}>
          <Button bsStyle="primary" onClick={() => this.submitLog('test.001')}>test.001</Button>
          <Button bsStyle="primary" onClick={() => this.submitLog('test.002')}>test.002</Button>
          <Button bsStyle="primary" onClick={() => this.submitLog('test.003')}>test.003</Button>
          <Button onClick={() => this.testLogService()}>test</Button>
        </ButtonGroup>
      </div>
    );
  }

}

const mapStateToProps = (state) => ({
  reason: state.logs.reason,
  user: state.user
});

const mapDispatchToProps = {
  sendLog: logActions.sendLog,
  testLogs: logActions.testLogs
};

export default connect(mapStateToProps, mapDispatchToProps)(ASMTesters);
