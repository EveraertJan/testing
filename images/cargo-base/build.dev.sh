#!/usr/bin/env bash

####################################################################################################
# Build the cargo-base image in development mode.
# --------------------------------------------------------------------------------------------------

echo
echo "# Build cargo-base image"

export NODE_ENV=development

# Load the basic environment variables:
source ../../.env

# Build the image:
docker build -f df.dev.yml --tag=cargo-base:dev .
