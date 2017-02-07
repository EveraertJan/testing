# Duxis Security

> This document will discuss the security aspects of the Duxis platform. It currently contains some relevant notes.


- The Duxis [Auth Framework](../../images/auth/README.md) provides functionality with which access to resources such as APIs can be restricted to authorized users. The [Cargo-Lib](../../images/cargo-base/README.md) provides log-in forms and other utilities that enable _Cargo-Fronts_ to interact with the auth functionality.

- API's must not return an array as it response. See [Anatomy of a Subtle JSON Vulnerability](http://haacked.com/archive/2008/11/20/anatomy-of-a-subtle-json-vulnerability.aspx/) for more details.

----
__[[ Back ](../../README.md)]__



[Chai]: http://chaijs.com
[Docker Compose]: https://www.docker.com/products/docker-compose
[dockerode]: https://www.npmjs.com/package/dockerode
[Mocha]: https://mochajs.org
