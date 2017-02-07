#!/usr/bin/env bash

####################################################################################################
# Start the server in production mode.
# --------------------------------------------------------------------------------------------------

export NODE_ENV="production"
export PROJECT_NAME="WIJZE_STAD"

./up.sh
