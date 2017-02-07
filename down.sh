#!/usr/bin/env bash

####################################################################################################
# Stop the server and remove the network and containers.
# --------------------------------------------------------------------------------------------------

# Load the project environment variables:
source .env

echo "
Down the $PROJECT_NAME server..."

docker-compose -p $DC_PROJECT -f dc.dev.yml down
docker-compose -p $DC_PROJECT -f dc.prod.yml down
