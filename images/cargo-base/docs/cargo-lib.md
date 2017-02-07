# The `Cargo-Lib` Package

## Synopsis

The `cargo-lib` package provides common functionality and utilities for the Cargo microservices. These services are implemented as [Node.js][] apps. The `cargo-lib` module is installed in all containers that are based on the [_Cargo-Base_ image](../README.md).

The `cargo-lib` module provides the following primary properties, which are documentated in more detail in the following sections.

| Property | Description |
|:-------- |:----------- |
| `CargoApp` | Base class for the main App classes in Cargo containers. See below for more details. |
| `storeManager` | Initialize, read from and write to storage (currently only OrientDB). |
| `utils` | A collection of utilities, imported from the `cargo-lib/lib/utils.js` module. Note that we are exploring an alternative means for providing utilities as separate modules in `cargo-lib/utils/` |

> TODO: Document all properties



## The `CargoApp` Base Class

Base class for the main App class that implements the service's functionality in a Cargo container. This base class provides the following functionalities:

- __Config API__: A common configuration API.
- __Stream Broker API__ : Subscribe of publish to channels on the message stream broker.
- __Server API__ : TODO
- __logging API__: TODO



## The Config API

### Configuration Files

Cargo containers are configured through a uniform configuration system based on [node-config](https://github.com/lorenwest/node-config). The configurations are specified in the config files in the `images/cargo-base/config/` directory. The default configuration is specified in `default.js`. Overriding onfigurations specific to deployment modes or hosts are provided in the other configuration files. The following table lists the configuration files from general to overriding specific.

| File | Description |
| ---- | ----------- |
| `default.js` | Base configuration for all deployments. |
| `development.yml` | Overriding configuration in development mode. |
| `production.yml` | Overriding configuration in production mode. |
| `tocker.yml` | Overriding configuration on tocker.iminds.be. This configuration overrides `development.yml` (when Soyl is deployed in production mode on tocker). |
| `local.yml` | Overrides all other applicable configurations. Besides host-specific configurations, this configuration should contain the secrets such as passwords, tokens, etc. This configuration file should be manually added to each deployment and should not be committed to the repository. It is consequently added in `.gitignore` file. The repository does provide `local.template.yml` which serves as template for concrete `local.yml` files. |

See the [configuration files](https://github.com/lorenwest/node-config/wiki/Configuration-Files) documentation of the _node-config_ package for more details on the overriding mechanisms.

### Loading the configuration

The config API can be accessed through the `config` property of the `CargoApp` base class, or through the `config` property of the `cargo-lib` module.

Configuration details should be obtained from the config object using the `get` method provided by [node-config](https://github.com/lorenwest/node-config).

The config PI provides the following basic properties:

| Property | Description |
|:-------- |:----------- |
| `version` | The overall Soyl Server version label. This configuration is set in `default.js`  as the value of the `SOYL_VERSION` environment variable set in the main `.env` file. |



## Broker API

> TODO: Update

The `CargoApp.broker` object provides the API to publish on or subscribe to a message stream on the broker.

> See [`cargo-lib/lib/broker/redis/Broker.js`](../../images/cargo-base/cargo-lib/lib/broker/redis/Broker.js) for more details on this API.



## Server API

The `CargoApp` base class provides methods for easily serving REST-like API's and static web content, i.e. `serveApi`, `serveSecureApi`, `serveStatic`, `serveFile` and `serveReact`. 

> TODO: generate additional documentation from the JSDocs in the source code.



## Logging API

Always use a logger object obtained from the `log4js` package.

```javascript
const log4js = require('log4js');
...
const log = log4js.getLogger('log-service');
```

This logger object provides the following methods.

- `log.fatal(*)`
- `log.error(*)`
- `log.warn(*)`
- `log.info(*)`
- `log.debug(*)`
- `log.trace(*)`




[Babel]: https://babeljs.io
[Bootstrap]: http://getbootstrap.com
[bootstrap-loader]: https://github.com/shakacode/bootstrap-loader
[bootstrap-sass]: https://github.com/twbs/bootstrap-sass
[Cargo]: ../../docs/dev/cargo-containers.md
[Docker]: https://www.docker.com
[Docker Compose]: https://www.docker.com/products/docker-compose
[ES6]: http://www.ecma-international.org/publications/standards/Ecma-262.htm
[ESLint]: http://eslint.org
[Koa]: http://koajs.com
[Node.js]: https://nodejs.org
[React]: https://facebook.github.io/react/
[React-Bootstrap]: http://react-bootstrap.github.io
[WebPack]: https://webpack.github.io
