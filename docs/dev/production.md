# Production Deployment Notes

> This section is under development!

### React
By default, _React_ runs in development mode. When the environment variable `NODE_ENV` is set to `production`, then _React_ runs in production mode.

### Babel
In the configuration of Babel, the `env` [option](https://babeljs.io/docs/usage/options/) can be used to differentiate between development and production. The value for this `env` option will be taken from `process.env.BABEL_ENV`, when this is not available then it uses `process.env.NODE_ENV`, and if even that is not available then it defaults to `development`.

### Running the Server

> TODO: Start the cluster as deamon.

```shell
docker-compose up --no-recreate -d
```

### Policy

- No volume bindings for application code, such that code stays inside the container and can’t be changed from outside.
- Specifying a restart policy (e.g., restart: always) to avoid downtime.

#### Deploying changes

When you make changes to your app code, you’ll need to rebuild your image and recreate your app’s containers. To redeploy a service called web, you would use:

```shell
$ docker-compose build web
$ docker-compose up --no-deps -d web
```

----
__[[ Back ](../../README.md)]__


[Docker Compose]: https://www.docker.com/products/docker-compose