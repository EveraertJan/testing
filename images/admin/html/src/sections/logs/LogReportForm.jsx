'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @author Jan Everaert for iMinds.be [jan.everaert@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import config from 'cargo-lib/html/system/config'
import request from 'cargo-lib/html/system/request'
import React from 'react'
import { Button, ControlLabel, FormControl, FormGroup, HelpBlock } from 'react-bootstrap/lib'

const REPORT_URL = `${config.wijzeStad.hosts.api}/logs/report.json`;
//console.log('- LogReportForm > REPORT_URL:', REPORT_URL);

/**
 * States
 */
const DEFAULT = 0, SENDING = 1, SENT = 2, ERROR = 3;

export default class LogReportForm extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      client: 'admin',
      eventType: 'as-test-01',
      content: 'test',
      state: DEFAULT
    };
  }

  /** @param {SyntheticEvent} event */
  clientChangeHandler(event) {
    this.setState({ client: event.target.value });
  }

  /** @param {SyntheticEvent} event */
  eventTypeChangeHandler(event) {
    this.setState({ eventType: event.target.value });
  }

  /** @param {SyntheticEvent} event */
  contentChangeHandler(event) {
    this.setState({ content: event.target.value });
  }

  /** @param {SyntheticEvent} event */
  submitHandler(event) {
    event.preventDefault();

    this.setState({ state: SENDING });

    const report = {
      client: this.state.client,
      user: 'dev.logReportForm',
      events: [
        {
          timestamp: new Date().toISOString(),
          type: this.state.eventType,
          content: this.state.content
        }
      ]
    };
    //console.log('report:', report);

    request.post(REPORT_URL, report)
      .then((reply) => {
        //console.log(reply);
        this.setState({ state: SENT });
        setTimeout(() => {
          if (this.state.state === SENT) {
            this.setState({ state: DEFAULT });
          }
        }, 2000);

        // @todo: change es > esm
        if (reply.data.asm) {
          console.log(`AS sheet: ${reply.data.asm.url}`);
        }
      })
      .catch((error) => {
        console.log(`Failed to submit the log report to ${REPORT_URL}.`, error);
        this.setState({ state: ERROR });
        setTimeout(() => {
          if (this.state.state === ERROR) {
            this.setState({ state: DEFAULT });
          }
        }, 5000);
      });
  }

  getClientValidationState() {
    const length = this.state.client.length;
    if (length >= 5) { return 'success'; }
    if (length > 0) { return 'warning'; }
    return 'error';
  }

  getEventTypeValidationState() {
    const length = this.state.eventType.length;
    if (length >= 5) { return 'success'; }
    if (length > 0) { return 'warning'; }
    return 'error';
  }

  render() {
    let submitLabel = 'Submit Log';
    if (this.state.state === SENDING) { submitLabel = 'Sending'; }
    else if (this.state.state === SENT) { submitLabel = 'Sent!'; }

    let bsStyle = 'default';
    if (this.state.state === SENDING) { bsStyle = 'info'; }
    else if (this.state.state === SENT) { bsStyle = 'success'; }

    return (
      <form onSubmit={this.submitHandler.bind(this)}>

        <FormGroup
          controlId="clientText"
          validationState={this.getClientValidationState()}
        >
          <ControlLabel>Client</ControlLabel>
          <FormControl
            type="text"
            value={this.state.client}
            placeholder="Enter client name"
            onChange={this.clientChangeHandler.bind(this)}
          />
          <FormControl.Feedback />
          <HelpBlock>Provide a string that has at least 5 characters.</HelpBlock>
        </FormGroup>

        <FormGroup
          controlId="EventTypeText"
          validationState={this.getEventTypeValidationState()}
        >
          <ControlLabel>Event Type</ControlLabel>
          <FormControl
            type="text"
            value={this.state.eventType}
            placeholder="Enter event type"
            onChange={this.eventTypeChangeHandler.bind(this)}
          />
          <FormControl.Feedback />
          <HelpBlock>Provide a string that has at least 5 characters.</HelpBlock>
        </FormGroup>

        <FormGroup
          controlId="ContentText"
        >
          <ControlLabel>Content</ControlLabel>
          <FormControl
            type="text"
            value={this.state.content}
            placeholder="Enter content"
            onChange={this.contentChangeHandler.bind(this)}
          />
        </FormGroup>

        <Button type="submit" bsStyle={bsStyle}>
          {submitLabel}
        </Button>
      </form>
    );
  }

}

/*
 <ButtonInput type="submit" bsStyle={bsStyle} value={submitLabel}
 style={{width: '100px'}} />
 */
