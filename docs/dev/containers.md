# Containers Overview

Containers such as those that run the Redis and OrientDB instances, use offical/canonical images configured and maintained by third-parties, typically the developers of the application that is run in those containers. We will call these _canonical_ containers.

Containers such as the _Log-Archiver_ or the _Admin_ are Mupets-specific containers implemented as Node.JS apps. We will call these [_Cargo_ containers](cargo-containers.md).

The Dockerfiles, source code and other assets used in Mupets containers are maintained in the `images/` directory in the root of the repository. This directory contains a directory for each container type in the Mupets Server, except for those directly based on canonical images.

Most of container templates in the `./images` directory provide two Dockerfiles: `df.dev.yml` and `df.prod.yml` (the latter is used for both staging and production). The difference between both is mainly situated in the way that code, configuration and other assets is included. The development images typically expose volumes to which local directories (or files) are mounted, such that these assets can be developed without having to rebuild the image time and again. In production mode, on the other hand, all assets are copied into the images, yielding _self-contained_ containers.


## Alternative Backbone Containers

These containers are no longer used but are retained in case they are needed instead of their replacements.

### Kafka Container

> Image directory: `images/kafka/`

[Apache Kafka][] is a distributed, partitioned, replicated real-time message stream broker [Kreps_11a]. This container can be used as an alternative for the _Redis-Broker_ container. The Kafka container is based on the [wurstmeister/kafka-docker](https://hub.docker.com/r/wurstmeister/kafka/) image ([source](https://github.com/wurstmeister/kafka-docker)).


### ZooKeeper Container

> Image directory: [none]

- [Apache ZooKeeper][] is a service which enables highly reliable distributed applications. The ZooKeeper instance in this cluster is used to manage the Kafka broker. The ZooKeeper container is based on [wurstmeister/zookeeper](https://hub.docker.com/r/wurstmeister/zookeeper/).
- The ZooKeeper instance is configured in `/opt/zookeeper-3.4.6/bin/../conf/zoo.cfg`.



----
__[[ Back ](../../README.md)]__


[Alpine]: http://alpinelinux.org
[Apache Kafka]: http://kafka.apache.org
[Apache ZooKeeper]: https://zookeeper.apache.org
[Babel]: https://babeljs.io
[Compose]: https://www.docker.com/products/docker-compose
[Docker]: https://www.docker.com
[Docker Compose]: https://www.docker.com/products/docker-compose
[Docker Toolbox]: https://www.docker.com/docker-toolbox
[ESLint]: http://eslint.org
[Kafka]: http://kafka.apache.org
[Nginx]: http://nginx.org
[Node.js]: https://nodejs.org
[OrientDB]: http://orientdb.com
[React]: https://facebook.github.io/react/
[Redis]: http://redis.io
[Swarm]: https://www.docker.com/products/docker-swarm
[VirtualBox]: https://www.virtualbox.org
[WebPack]: https://webpack.github.io
[ZooKeeper]: https://zookeeper.apache.org
