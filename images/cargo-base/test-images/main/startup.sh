#!/usr/bin/env bash

#echo "# Cargo-base test-image startup.sh"
if [ -z "$TESTS" ]; then export TESTS=.; fi
cd /cargo/cargo-lib/test
mocha --bail --recursive ../../cargo-lib/utils/fixtures/rootHooks $TESTS
