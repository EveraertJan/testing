# Mupets Back-End

## Synopsis

The _Mupets_ project aims to provide a lightweight and flexible software infrastructure for __user activity logging__ and _reactive_ __[experience sampling](https://en.wikipedia.org/wiki/Experience_sampling_method)__ for mobile apps.

The _Mupets Back-End_ provides the server-side functionality for the _Mupets_ project.
It provides an activity logging HTTP-service for submitting __activity log events__.
App developers can use one of the _Mupets Client_ libraries for submitting their activity events.

The back-end incorporates a rules engine which matches rules against the incoming activity log stream.
When a rule matches, the server responds with an instruction to initiate an experience sampling.
The client library then presents the user with the experience sampling interface, which is an arbitrary web page fetched from the web server included in the _Mupets_ back-end or from another server.
The user's response is submitted back to the _Mupets Back-End_.

The incoming log stream and sampling responses are stored in a document database.
The data in this database can be inspected by means of an included web interface.

The _Mupets_ system also provides a (basic) admin web interface that shows the live stream of log events and an interface to submit arbitrary events.
The _Mupets_ system also provides a basic [Slack][] bot.


## Development Notes

- We plan to separate _Mupets_ from the base infrastructure it makes use of. This base infrastructure is called _Soyl_ [TBC]. Some containers are still called _mupets-something_. These will be renamed to _soyl-something_.


## User Documentation

- [Activity Logging](docs/user/activity-logging.md)
- [Experience Sampling](docs/user/experience-sampling.md)
- [Mupets Admin](docs/user/admin.md)
- [Change Log](CHANGELOG.md)


## Developer Documentation

- [Developer Documentation](docs/dev/index.md)


## Further Resources

- Report issues at [https://bitbucket.org/iminds/mupets-server/issues](https://bitbucket.org/iminds/mupets-server/issues).



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
[OrientDB Studio]: https://www.youtube.com/watch?v=_drDX1_tUZw
[React]: https://facebook.github.io/react/
[Slack]: https://slack.com
[Swarm]: https://www.docker.com/products/docker-swarm
[VirtualBox]: https://www.virtualbox.org
[WebPack]: https://webpack.github.io
[ZooKeeper]: https://zookeeper.apache.org
