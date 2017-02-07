#!/usr/bin/env bash

####################################################################################################
# Start the server.
# --------------------------------------------------------------------------------------------------

# Load the project environment variables:
source .env

echo "
Starting $DC_PROJECT server using $DC_FILE ..."

docker-compose -p $DC_PROJECT -f $DC_FILE create
if [ "$NODE_ENV" == "development" ]; then
  docker-compose -p $DC_PROJECT -f $DC_FILE up -t 5
else
  docker-compose -p $DC_PROJECT -f $DC_FILE up -d
fi
