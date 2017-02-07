'use strict';

/**
 * @author Wouter Van den Broeck for iMinds.be [wouter.vandenbroeck@iminds.be]
 * @copyright 2016, iMinds v.z.w.
 */

const Docker = require('./Docker');

const docker = new Docker();

function printNetworks(log) {
  if (!log) { log = console.log; }
  return docker.listNetworksAsync()
    .then((networks) => {
      //log('networks:', networks);
      log('# NETWORKS:');
      networks.forEach((network) => {
        log(`- ${network.Name}`);
        Object.keys(network.Containers).forEach((id) => {
          let container = network.Containers[id];
          log(`  - ${container.Name}`);
        });
      });
    });
}

module.exports = printNetworks;
