#!/usr/bin/env bash

echo
echo "# Starting cargo-packer..."

cd /cargo
#echo; pwd; ls -la .

cd /cargo/config
echo; pwd; ls -la .

cd /cargo/app
echo; pwd; ls -la .
#cat package.json

cd /cargo/app/lib
echo; pwd; ls -la .

#cd /cargo/html
#echo; pwd; ls -la .

#cd /cargo/html/src
#echo; pwd; ls -la .

#echo "- APP_WATCH_MODE: $APP_WATCH_MODE"
#echo "- CARGO_DELAY: $CARGO_DELAY"
#echo "- CARGO_DELAY_OVERRIDE: $CARGO_DELAY_OVERRIDE"
#echo "- HTML_WATCH_MODE: $HTML_WATCH_MODE"
#echo "- SOYL_HOST: $SOYL_HOST"
#echo "- SOYL_VERSION: $SOYL_VERSION"
#echo "- VERBOSE: $VERBOSE"

#echo
#echo "# ifconfig:"
#ifconfig

# sudo ifconfig lo0 alias 172.16.123.1

#ping -c 5 172.16.123.1

#npm cache ls

#ip route
#export DOCKER_HOST_IP=$(ip route -n | awk '/UG[ \t]/{print $2}')
#echo
#echo "DOCKER_HOST_IP: $DOCKER_HOST_IP"

cd /cargo/app/lib
node pack.js
