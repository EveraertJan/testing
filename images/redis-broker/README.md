# Duxis _Redis-Broker_ Container

> Image directory: `images/redis-broker/`

## Synposis

This container runs an instance of the [Redis][] server, an in-memory data structure store. This container is based on the official [Redis image](https://hub.docker.com/_/redis/), in particular the Alpine variant.

Redis is here used as publish/subscribe message broker.
It acts as the beating heart of the Duxis stream architecture.

[Cargo][] containers that need to publish or subscribe to data streams on the broker should use the Broker API provided by the CargoLib in the [Cargo][] base image.

[Cargo]: ../../docs/dev/cargo-containers.md
[Redis]: http://redis.io
