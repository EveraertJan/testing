#!/usr/bin/env bash

####################################################################################################
# Updates the production deployment
# --------------------------------------------------------------------------------------------------

git pull
./build.prod.sh
./up.prod.sh