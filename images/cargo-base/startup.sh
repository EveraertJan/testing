#!/usr/bin/env bash

# This script is called as the initial command when the container is started.
# It is called from the cargo-base Dockerfile (i.e. df.dev.yml or df.prod.yml).
# When the environment variable `APP_WATCH_MODE` is set to `true`, then the app is started using
# nodemon, such that the app is restarted when the source code is modified.
#
# Note that when you modify this script, you need to rebuild all cargo service images.

if [ "$NODE_ENV" == "test" ]; then
  echo "Test mode for service $SERVICE and subject $TEST_SUBJECT ..."
  if [ "$SERVICE" == "$TEST_SUBJECT" ]; then
    # Run mocha only with this service is the current test subject:
    if [ -z "$TESTS" ]; then TESTS=.; fi
    cd /cargo/app/test
    mocha --bail --recursive /cargo/cargo-lib/utils/fixtures/rootHooks $TESTS
  else
    # Start the Cargo app normally when this service is not the current test subject:
    node lib/index.js
  fi
elif [ "$APP_WATCH_MODE" == "true" ]; then
  echo "Using nodemon..."
  if [ "$POLLING_WATCH" == "true" ]; then
    # Use `legacy-watch` with Docker Toolkit:
    nodemon \
      --watch /cargo/app/lib \
      --watch /cargo/cargo-lib \
      --watch /cargo/config \
      --legacy-watch \
      --ext js,jsx,json,yml \
      lib/index.js;
  else
    # Do not user `legacy-watch` with Docker Native:
    nodemon \
      --watch /cargo/app/lib \
      --watch /cargo/cargo-lib \
      --watch /cargo/config \
      --ext js,jsx,json,yml \
      lib/index.js;
  fi
elif [ "$NODE_ENV" == "development" ]; then
  node --debug=5858 lib/index.js
else
  node lib/index.js
fi
