# Duxis System Set-Up

## Configuration

The current setup depends on two sets of configurations:

- The `.env` configuration. These configurations are used in the Docker Compose files and the bash scripts used to build/start/stop/inspect the microservices.

- The configuration files in `images/cargo-base/config/`. These configurations are shared by the microservices.

For each installation you typically need to provide the following local configuration files:

- `.env` : Copy `.env.template` and provide appropriate values for the environment variables declared in this file, as detailed below.

- `images/cargo-base/config/local.yml` : Copy `local.template.yml` and provide appropriate configuration values.



## Environment Variables

The following environment variables need to be set in the `.env` file.

| Variable | Description |
|:-------- |:----------- |
| `SOYL_VERSION` | The _Soyl_ version. |
| `SOYL_HOST` | The name or IP of the Soyl host. |
| `DC_PROJECT` | The Docker Compose project name to use. If you deploy multiple Soyl systems on the same server, then you need to provide distinct values for this variable in order to avoid name clashes. |



## Deployment Modes

The following main deployment modes are currently provided in this project:

| Mode | Description |
|:----:|-------------|
| `development` | The system is deployed on the local machine of the developer.
| `production` | The production deployment.

The deployment mode is controlled by the `NODE_ENV` environment variable,
which can be set to `development` (the default value) or `production`.
Some containers provide additional development modes.
More details on these are provided further in this document.



## Docker-Compose Setup

In development mode we want to be able to iterate quickly when developing the business containers.
This means that we want to mount the source code from the host into the business containers such that we don't have to rebuild the container time and again.
In production, on the other hand, we want the containers to be self-contained by copying all source code and other assets into the images.

To achieve these objectives, two parallel build configuration stacks are provided, one for development and one for production.
For each stack, separate _Docker-Compose_ configuration files, image configuration files and build/up/down scripts are provided.
We therefore do not follow the naming convenntion for the compose and image configuration files (`docker-compose.yml` and `Dockerfile`) but instead use the following custom naming scheme.

| Convention | Custom Pattern |
|:----------:|:--------------:|
| `docker-compose.yml` | `dc.{env}.yml` |
| `Dockerfile` | `df.{env}.yml` |

You probably understood that the `dc` an `df` parts of the custom pattern are abbreviations for respectively _docker-compose_ and _docker-file_ respectively.

The Mupets system currently provides the following Docker Compose configuration files:

| Configuration | Deployment mode |
|:-------------:|:----------------|
| `dc.base.yml` | The shared base configuration.
| `dc.dev.yml`  | The configuration for the _development_ mode.
| `dc.prod.yml` | The configuration for the _production_ mode.
| `dc.test.yml` | The configuration for Mocha-based unit testing.

The services in `dc.dev.yml` and `dc.prod.yml` extend common service configurations in `dc.base.yml`, while `dc.test.yml` extends `dc.dev.yml`.

> Dev note: Unit testing in production mode will have to be considered.

The `docker-compose` command thus needs to be called with the `-f` option to specify the file to load, as in:

```shell
docker-compose -f dc.dev.yml build
docker-compose -f dc.prod.yml up
...
```



## Development Scripts

There are two sets of scripts, system-wide and service-specific scripts.

### System Scripts

The first set is provided in the project root directory. These scripts help in system-wide operations.

| Script | Purpose |
|--------|---------|
| `build.dev.sh` | Build for development deployment. |
| `build.prod.sh` | Build for production deployment. |
| `build.sh` | Helper script for the above _build_ scripts. Not to be used directly. |
| `up.dev.sh` | Start the development deployment. |
| `up.prod.sh` | Start the production deployment in detached mode. |
| `up.sh` | Helper script for the above _up_ scripts. Not to be used directly. |
| `stop.sh` | Stop all services. |

### Service Scripts

The `./scripts` directory provides a set of development scripts with which you can build/start/stop/inspect individual images and services. The repository includes a set of base scripts. The scripts to actually manipulate the individual services need to be generated. To do so, you need to execute the `create-scripts.sh` script.

The service scripts are generated according to the information in the `soyl.yaml` files provided for each service.

> TODO: Document the different type of service scripts.


For cargo templates that provide both an Cargo app and a Cargo front-end, the following additional scripts are provided.

| Script | Description |
|:------ |:----------- |
| `build.{service}.app.sh` | Builds the service image. |
| `build.{service}.html.sh` | Builds the html content using the `{service}-packer` container. |
| `build.{service}.packer.sh` | Builds the `{service}-packer` image, which builds the html content. |
| `build.{service}.sh` | Builds the service image, the `{service}-packer` image, and the html content. |
| `watch.{service}.app.sh` | Starts the service in the _App-Watch-Mode_. See [Developing a Cargo Container](../../images/cargo-base/docs/cargo-development.md) for more information. |
| `watch.{service}.html.sh` | Starts the service in the _HTML-Watch-Mode_. See [Building Cargo Front-ends](../../images/cargo-base/docs/cargo-frontend.md)  for more information. |
| `watch.{service}.sh` | Starts the service with both the _App-Watch-Mode_ and _HTML-Watch-Mode_ enabled. |



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
[Swarm]: https://www.docker.com/products/docker-swarm
[VirtualBox]: https://www.virtualbox.org
[WebPack]: https://webpack.github.io
[ZooKeeper]: https://zookeeper.apache.org
