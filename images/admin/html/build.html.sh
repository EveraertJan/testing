#!/usr/bin/env bash

####################################################################################################
# Pack the web content using the admin-packer container.
# --------------------------------------------------------------------------------------------------

# Load the basic environment variables:
source ../../../.env

echo "
# Packing the admin front-end"

docker-compose -p $DC_PROJECT -f dc.yml up fogg-admin-packer
