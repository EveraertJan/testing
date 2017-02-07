'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

import config from 'cargo-lib/html/system/config'
import React from 'react'
import Button from 'react-bootstrap/lib/Button'
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar'
import Panel from 'react-bootstrap/lib/Panel'

export default function ToolsPanel() {
  return (
    <Panel header="Tools">
      <ButtonToolbar>
        <Button bsStyle="primary" href={config.fogg.hosts.pg}>PGWeb</Button>
        <Button bsStyle="primary" href={`${config.fogg.hosts.admin}:8080`}>Traefik Studio</Button>
      </ButtonToolbar>
    </Panel>
  );
}
