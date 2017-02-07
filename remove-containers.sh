#!/usr/bin/env bash

# Stop the containers:
./stop.sh

# Load the project environment variables:
source .env

# Delete all project containers:
#
# Container name pattern:
# - <project>_<service>_<#>
#
CONTAINERS=$(docker ps -a -q --filter "name=${DC_PROJECT}_")
if [ "$CONTAINERS" ]; then
  docker rm -f $CONTAINERS
fi
