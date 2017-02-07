# Soyl _Proxy_ Service

> Image directory: `images/proxy/`


## Synposis

This service uses [Traefik][] as a reverse proxy server for front-ends and api's exposed by the services.



## Default Configuration

[Traefik][] is configured to use Docker as a backend configuration. This means that Traefik dynamically obtains the proxy rules from the [Docker][] daemon. You can add rules for exposing a front-end or api from a service by providing `traefik.*` labels in the [Docker Compose][] files.

### Examples

The following example Docker Compose configuration specifies Traefik rules for the service `foo` using labels. The `traefik.backend` label assign the container to the `foo` backend. The `traefik.frontend.rule` label tells Traefik to forward requests on the `foo.bar.com` domain it receives to this service. The `traefik.port` label specifies on which port in the container the requests should be forwarded.

```
services:
  foo:
    ...
    labels:
      traefik.backend: foo
      traefik.frontend.rule: Host:foo.bar.com
      traefik.port: "80"
```

The following example specifies Traefik rules for two service: `foo` and `bar`. Each is assigned a different backend. Traefik will forward requests on the `api.com` domain with a url path that start with `/foo`, are forwarded to the `foo` service, while requests with a url path that start with `/bar`, are forwarded to the `bar` service.

```
services:
  foo:
    ...
    labels:
      traefik.backend: foo-api
      traefik.frontend.rule: Host:api.com; PathPrefix:/foo
      traefik.port: "80"
  bar:
    ...
    labels:
      traefik.backend: bar-api
      traefik.frontend.rule: Host:api.com; PathPrefix:/bar
      traefik.port: "80"
```

Consult the [Traefik Docs](https://docs.traefik.io/toml/#docker-backend) for further configuration details.



## Mupets-Specific Configuration

### Proxy Rules

The following table provides an overview of the current Mupets-specific proxy rules.

| Request URL Template | Type | Service | Port | Route |
|:-------------------- |:---- |:------- | ---- | ----- |
| `api.{domain}:80/logs/*` | Logging API | mupets-log-service | 80 | `/logs/*` |
| `api.{domain}:80/results/*` | Results API | mupets-log-archiver | 80 | `/results/*` |
| `api.{domain}:80/rules/*` | Rules API | mupets-rules-engine | 80 | `/rules/*` |
| `api.{domain}:80/sheet/*` | Sheets API | mupets-sheet-admin | 80 | `/sheet/*` |
| `admin.{domain}:80/*` | Admin Frontend | mupets-admin | 80 | `/*` |
| `sheets.{domain}:80/*` | Sheets Server | mupets-sheet-server | 80 | `/*` |
| `orientdb.{domain}:80/*` | OrientDB Studio | soyl-orientdb | 2480 | `/*` |
| `{domain}:8080/*`    | Traefik Frontend | soyl-proxy | 8080 | `/*` |


### Hosts Configuration

The `{domain}` part in the request URL templates in the above table should be replaced by a concrete domain. In a local development deployment, this is typically `mupets`. This entails that you must provide the following host mappings in your _hosts_ file, replacing the IP address (here `192.168.99.100`) with the IP address of your Docker daemon.

```
192.168.99.100  admin.mupets
192.168.99.100  api.mupets
192.168.99.100  orientdb.mupets
192.168.99.100  sheets.mupets
```




[Cargo]: ../../docs/dev/cargo-containers.md
[Docker]: https://www.docker.com
[Docker Compose]: https://www.docker.com/products/docker-compose
[Traefik]: https://traefik.io
