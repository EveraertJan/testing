# Developing a Cargo Container

## App-Watch-Mode

During development, Cargo containers can be started in the so-called _App-Watch-Mode_. In this mode the node app is automatically restarted when the source code is modified. To use this mode for particular Cargo container, the `APP_WATCH_MODE` environment variable should be set to `"true"` before starting the container. You can use a `watch.<service>.sh` script in the `/scripts` directory to start a Cargo container with the watch-mode activated.

#### Technical Background:

The last instruction in `cargo-base/df.dev.yml`, which is the DockerFile that configures the Cargo-Base image, is `ONBUILD CMD ["bash",  "startup.sh"]`. As a result of this instruction, when a Cargo container is started, it first executes the `startup.sh` script. This script is located in the root of the `cargo-base` image template and is copied to the `/cargo/app/` directory in the image, which is the working directory when the container is started. The `startup.sh` script starts the Cargo app with [nodemon][] when the value of the `APP_WATCH_MODE` environment variable is `true`. Nodemon has to use the legacy watch mode (`--legacy-watch`) because of the Docker environment. This legacy watch mode uses polling, wich is inefficient. This is why we do not use nodemon by default.



## Included Modules

The `cargo-base` image includes a collection of useful packages which can be used in Cargo apps. The complete list of modules can be found in the `cargo-base/package.json` file. The following table lists the most prominent of these modules.

| Package | Notes |
|:------- |:----- |
| [axios](https://www.npmjs.com/package/axios) | Promise based HTTP client. |
| [bluebird](https://www.npmjs.com/package/bluebird) | Should be used for all Promise needs. |
| [fs-extra](https://www.npmjs.com/package/fs-extra) | Drop in replacement for Node's `fs` module, with a set of additional file system utilities. |
| [lodash](https://www.npmjs.com/package/lodash) | Alternative for underscore |
| [moment](https://www.npmjs.com/package/moment) | |
| [retrying-promise](https://www.npmjs.com/package/retrying-promise) | |
| [rimraf](https://www.npmjs.com/package/rimraf) | |

There are also a number of testing packages.

| Package | Notes |
|:------- |:----- |
| [chai](https://www.npmjs.com/package/chai) | |
| [mocha](https://www.npmjs.com/package/mocha) | |



## Delayed Start-Up

When starting the Soyl server, the start-up of several Cargo containers is delayed by a couple of seconds.
This is not because these containers need to wait for other containers to be up and running first as this is considered bad practice: Containers that depend on other containers should be capable of checking if these other containers are available and deal accordingly.

The start-up delay is nonetheless provided as a means to stagger the start-up and the consequent log messages these containers emit.
This delay is specified by means of the `CARGO_DELAY` environment variable, which needs to be set before starting the container.
This delay is typically set in the Docker-Compose files (such as `dc.dev.yml`).

However, when starting individual containers by means of the scripts in the `scripts` directory, you typically don't want this delay to be applied. However, the values for the `CARGO_DELAY` environment variable are set in the `dc.dev.yml` Docker Compose file. 

It is (currently) not possible to set a default value for a environment variable in a Docker Compose file because extended shell-style features, such as `${VARIABLE-default}` and `${VARIABLE/foo/bar}`, are [not supported](https://docs.docker.com/compose/compose-file/#/variable-substitution).
This is why the `up.<service>.sh` scripts use the `CARGO_DELAY_OVERRIDE` environment variable, which is set in these bash scripts, to override the `CARGO_DELAY` set in the Docker Compose file.





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
[nodemon]: https://github.com/remy/nodemon
[React]: https://facebook.github.io/react/
[React-Bootstrap]: http://react-bootstrap.github.io
[WebPack]: https://webpack.github.io
