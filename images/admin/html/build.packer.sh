#!/usr/bin/env bash

####################################################################################################
# Build the admin-packer image.
# --------------------------------------------------------------------------------------------------

echo
echo "# Building admin packer image..."

# Load the basic environment variables:
source ../../../.env

docker-compose -p $DC_PROJECT -f dc.yml rm -f fogg-admin-packer
docker-compose -p $DC_PROJECT -f dc.yml build fogg-admin-packer
