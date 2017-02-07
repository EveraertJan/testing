# Mupets Server Change Log

This document keeps track of the important changes.

## v0.7.0

- Added decentralized authentication and activity-based authorization using JWT-tokens.
  When using `CargoApp.serveSecureApi()` instead of `CargoApp.serveApi()`, the `initializer` argument is called with a `SecureRouter` instance instead of a regular `koa-router`.
  The `get`/`post`/`delete`/... methods for the `SecureRouter` take as second argument the name of the activity the user must be authorised to perform, which is asserted by a middleware inserted by the `SecureRouter`.
- Replaced `mupets-proxy` service by optional `soyl-proxy` that uses [Traefik][] as reverse proxy server.
  The URL paths, hosts and internal routes have been changed.
  See [proxy/README.md](images/proxy/README.md) for more details.
- Refactored several utilities such as `prependError` so that they can be required using `require('cargo-lib/utils/prependError')`. 
- Refactored configuration structure.
- Upgraded dependencies.

## v0.6.0

- Renaming to Soyl.

## v0.5.0

- Merged Admin-Frontend and Admin-Service in Admin service.
- Removed Wappr-Actuator-Service.

## v0.4.0

- Added serveApi and serveStatic to CargoApp for serving api's and static files.

## v0.3.0

- Replaced static sheet-server with sheet-server and sheet-admin services, which provide a front-end for specifying and generating ESM sheets.
- Added basic rules engine service.
- Added experimental Wappr actuator service.
- Switched to coroutine-based API in Cargo App class.

## v0.2.0

- Added experimental Slack-Service bot.

## v0.1.2

- Replaced Apache Kafka with Redis as stream broker.

## v0.1.0

- Added basic experience sampling (ESM) functionality.
- Added proxy container for public services.
- Enabled production deployment environment.
- Added base Cargo image used by all business containers.
- Added configuration framework.
- Added Admin-Frontend and Admin-Service containers.

## v0.0.2

- Migrated to docker-compose.yml version 2

## v0.0.1

- The initial alpha version, which includes the following containers: ZooKeeper, Kafka, OrientDB, Log-Service, Log-Archiver



[Cargo]: ../../docs/dev/cargo-containers.md
[Docker]: https://www.docker.com
[Docker Compose]: https://www.docker.com/products/docker-compose
[Nginx]: http://nginx.org
[Traefik]: https://traefik.io
