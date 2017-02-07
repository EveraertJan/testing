#!/usr/bin/env bash

####################################################################################################
# build the server.
#
# Instructions:
#
# - Set the value of the NODE_ENV environment variable to 'development' (the default value),
#   'staging' or 'production' before running this script.
# --------------------------------------------------------------------------------------------------

# Load the project environment variables:
source .env

echo "
Building $PROJECT_NAME using $DC_FILE ..."

# add execution permissions:
find . -name \*.sh -exec chmod u+x,g+x {} \;

# Build the base containers:
cd images/cargo-base; ./build.${DC_ENV}.sh || exit 1; cd - > /dev/null

# Build admin web content:
cd images/admin/html
./build.packer.sh || exit 1
./build.html.sh || exit 1

cd - > /dev/null

# Pull and build the images:
docker-compose -p $DC_PROJECT -f $DC_FILE pull
docker-compose -p $DC_PROJECT -f $DC_FILE build
