#!/usr/bin/env bash

####################################################################################################
# Shows the logs - Useful in production mode when the logs are not sent to stdout or stderr.
# --------------------------------------------------------------------------------------------------

# Load the project environment variables:
source .env

docker-compose -p $DC_PROJECT -f $DC_FILE logs
