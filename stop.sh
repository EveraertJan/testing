#!/usr/bin/env bash

####################################################################################################
# Stop the server.
# --------------------------------------------------------------------------------------------------

# Load the project environment variables:
source .env

echo "
Stop the $PROJECT_NAME server..."

docker-compose -p $DC_PROJECT -f dc.dev.yml stop
docker-compose -p $DC_PROJECT -f dc.prod.yml stop
