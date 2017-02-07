# Cargo Service Set-up


## Cargo Container Set-up

To come to an understanding of the way a Cargo service is structured, we will start by looking at the main directory structure and key files in a Cargo container.

All Cargo containers are structured in the same way.
The following schema shows the common directory structure.

```
/cargo/
 +- cargo.yml               # cargo manifest
 +- cargo-lib/              # cargo-lib package
 |   +- html/               # common cargo fornt-end code and assets
 |   +- lib/                # source code
 |   +- test/               # test code
 |   +- package.json        # cargo-lib package declaration
 |   +- utils/              # utilities [1]
 +- config/                 # system configuration files
 +- local_modules/          # locally maintained customized packages [1]
 +- node_modules/           # dependencies from /cargo/package.json
 +- package.json            # cargo-base package config
 +- app/                    # cargo app
 |   +- config/             # app configuration [1, 3]
 |   +- lib/                # source code
 |   |   +- index.js        # app entrypoint
 |   +- node_modules/       # dependencies from /cargo/app/package.json
 |   +- package.json        # package config
 |   +- startup.sh          # the container startup script
 |   +- test/               # app test code
 +- html                    # cargo front-end [3]
 |   +- dist/               # packed bundles and associated assets
 |   |   +- index.html      # front-end entrypoint
 |   |   +- config.js       # the config.js file with select configurations
 |   +- node_modules/       # dependencies from /cargo/html/package.json [2]
 |   +- package.json        # cargo app package config [2]
 |   +- src/                # source code [2]
```

- [1] under consideration
- [2] only in development mode
- [3] optional

The following table shows where the primary files and directories in a Cargo container are sourced from. All `cargo-base/*` assets are sourced from `./images/cargo-base/`. All `<service>/*` assets are sourced from one of the service templates in `./images/`.

| Source                              | Container |
|:----------------------------------- |:--------- |
| `cargo-base/cargo-lib/`             | `/cargo/cargo-lib/` |
| `cargo-base/config/`                | `/cargo/config/` |
| `cargo-base/local_modules/`         | `/cargo/local_modules/` [1] |
| `cargo-base/package.json`           | `/cargo/package.json` |
| `cargo-base/startup.sh`             | `/cargo/app/startup.sh` |
| `<service>/cargo.yml`               | `/cargo/cargo.yml` |
| `<service>/config/`                 | `/cargo/app/config/` [3] |
| `<service>/html/dist/`              | `/cargo/html/dist/` [3] |
| `<service>/html/package.json`       | `/cargo/html/package.json` [2, 3] |
| `<service>/html/src/`               | `/cargo/html/src/` [2, 3] |
| `<service>/lib/`                    | `/cargo/app/lib/` |
| `<service>/package.json `           | `/cargo/app/package.json ` |
| `<service>/test/`                   | `/cargo/app/test/` |

- [1] under consideration
- [2] only in development mode
- [3] optional



## The _Cargo-Base_ Image

The `cargo-base` base image template provides the following files.


### `cargo-base/`

| Files       | Description |
|:----------- |:----------- |
| `build.dev.sh` | Build script for development mode. This script builds the `cargo-base:dev` image. |
| `build.prod.sh` | Build script for production mode. This script builds the `cargo-base` image. |
| `cargo-lib/` | The `cargo-lib` package source code. |
| `config/` | The system configuration files. |
| `df.dev.yml` | Dockerfile for development mode. |
| `df.prod.yml` | Dockerfile for production mode. |
| `docs/` | Documentation. |
| `local_modules/` | A set of locally maintained forks of Node modules. This directory is mounted or copied to `/cargo/local_modules/`, which is added to the `NODE_PATH` environment variable such that Node includes it when resolving modules. |


### `cargo-base/cargo-lib/`

The `cargo-lib/package.json` does not specify dependencies.
All dependencies are specified in `cargo-base/package.json `, which are installed in `/cargo/node_modules/`.
All these dependencies can thus be imported in the `cargo-lib` code, the app code, and the front-end code.

As the `cargo-lib` package has no dependencies, there is no need to install them using `npm install`. The `cargo-lib` directory can thus become a volume (in development mode) which is directly bound to the local `cargo-lib` directory, instead of having to mount the `cargo-lib/lib`, `cargo-lib/html` and `cargo-lib/test` directories seperately.

See the [_Cargo-lib_ Package](cargo-lib.md) for further documentation of this package.


### `cargo-base/config/`

See _The Config API_ section in the [_Cargo-lib_ Package](cargo-lib.md) documentation.



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
