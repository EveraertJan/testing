'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import config from 'cargo-lib/html/system/config'
import React from 'react'
import Socket from 'socket.io-client'

import SocketStatusLabel from '../../components/SocketStatusLabel'

const LOG_STREAM_URL = `${config.wijzeStad.hosts.api}:${config.wijzeStad.logStreamPort}`;
//console.log('- LogItemsList > LOG_STREAM_URL:', LOG_STREAM_URL);

const MAX_ITEMS = config.wijzeStad.logServicePanel.logItemsList.maxItems;

let eventCnt = 0;

export default class LogItemsList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      logEvents: []
    };

    this.socket = new Socket(LOG_STREAM_URL);

    this.socket.on('connect', () => {
      console.log('Connected to the log-event stream socket server.');
    });
    this.socket.on('log-event', (data) => {
      this.addLogEvent(data);
    });
    this.socket.on('disconnect', () => {
      console.log('Disconnected from the log-event stream socket server');
    });
    this.socket.on('connect_error', (err) => {
      console.error(`Error while connecting with the socket server at ${LOG_STREAM_URL}.`, err);
      throw err;
    });
  }

  /**
   * @param {Object} logEvent - A JSON object.
   */
  addLogEvent(logEvent) {
    const logEvents = this.state.logEvents;
    logEvents.unshift({
      logEvent,
      key: ++eventCnt
    });
    while (logEvents.length > MAX_ITEMS) { logEvents.pop(); }
    //console.log('logEvents:', logEvents);
    this.setState({ logEvents });
  }

  render() {
    const logItemEls = this.state.logEvents.map(logEvent =>
      <li className="log-item" key={logEvent.key}>
        {logEvent.logEvent}
      </li>
    );

    return (
      <div>
        <SocketStatusLabel socket={this.socket} />
        <ul className="log-items">
          {logItemEls}
        </ul>
      </div>
    );
  }

}
