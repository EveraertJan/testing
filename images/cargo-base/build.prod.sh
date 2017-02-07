#!/usr/bin/env bash

####################################################################################################
# Build the cargo-base image in production mode.
# --------------------------------------------------------------------------------------------------

echo
echo "# Build cargo-base image"

export NODE_ENV=production

# Load the basic environment variables:
source ../../.env

# Build the image:
docker build -f df.prod.yml --tag=cargo-base .
