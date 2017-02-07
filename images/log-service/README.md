# Mupets _Log-Service_ Container

> Image directory: `images/log-service/`

> TODO: Rename to _LAES-Service_ (Logging And Experience Sampling Service)

## Synopsis

This container is a [Cargo-container](../../docs/dev/cargo-containers.md) that runs a Node.JS app that provides the [Activity Logging Service](../../docs/user/activity-logging.md) and dispatches [Experience Sampling](../../docs/user/experience-sampling.md) instructions. The service is implemented as a HTTP-server that listens for POST-requests on a configurable route. The body of this request should be a JSON-document that conforms to the requirements outlined in the [Activity Logging Service](../../docs/user/activity-logging.md) documentation. These JSON-documents represent so-called log-reports. Each log-report may contain one or more log-events. Upon reception of a log-report, the service publishes each log-event separately on a configurable channel on the stream broker.

For testing purposes, the current implementation checks the type of the most-recent log-event in each log-report, and includes an experience sampling instruction when this type is `es-test-01`. See the [Experience Sampling](../../docs/user/experience-sampling.md) documentation for more details.

## Set-up & Configuration

The main configuration for this container is provided in the `logService` object in the `config` object. See the [Cargo-container](../../docs/dev/cargo-containers.md) documentation for more details on the configuration API.

The HTTP-server is implemented with [Koa][] and uses the middleware extensions listed in the following table.

## expected result

```
{
  "client":"mupets-admin",
  "user":"dev.ASMTesters",
  "platform":"web",
  "events":[
    {
      "timestamp":1479895424918,
      "type":"test.001",
      "last":1479895424017,
      "count":1
    }
  ]
}
```

| Extension | Purpose |
|:---------:| --------|
| [kcors](https://www.npmjs.com/package/kcors) | Cross-Origin Resource Sharing (CORS) headers
| [koa-bodyparser](https://www.npmjs.com/package/koa-bodyparser) | Body parser
| [koa-route](https://www.npmjs.com/package/koa-route) | Routing



[Koa]: http://koajs.com
