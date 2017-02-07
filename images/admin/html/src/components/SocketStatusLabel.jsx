'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import React, { PropTypes } from 'react'

const CONNECTING = { label: 'connecting', color: '#D3AE32' };
const CONNECTED = { label: 'connected', color: '#5B876B' };
const ERROR = { label: 'error', color: '#D3795C' };

/**
 *  A label that dynamically shows the status of a socket connection.
 */
export default class SocketStatusLabel extends React.Component {

  constructor(props) {
    super(props);

    this.state = CONNECTING;

    props.socket.on('connect', () => { this.setState(CONNECTED); });
    props.socket.on('disconnect', () => { this.setState(CONNECTING); });
    props.socket.on('connect_error', () => { this.setState(ERROR); });
  }

  render() {
    const style = {
      backgroundColor: this.state.color
    };

    return (
      <div className="connection-status" style={style}>
        {this.state.label}
      </div>
    );
  }

}

SocketStatusLabel.propTypes = {
  socket: PropTypes.shape({
    on: PropTypes.func.isRequired
  }).isRequired
};
