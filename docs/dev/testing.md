# Duxis Testing Framework

We distinguish between _unit testing_ and other to be determined forms of tests.


## Unit Testing

Unit tests are meant to test a particular _unit_ of functionality, like a function, a class or an API.
Mostly such functionality concerns one particular service, but sometimes two (or more) might be involved, such as a class in one service that persists data in a Redis instance served by another service.

The tests for a given service are provided in the `test` directory of that service's template.
Unit tests are implemented using [Mocha][] and [Chai][].
The package [chai-as-promised](https://www.npmjs.com/package/chai-as-promised), [chai-http](https://www.npmjs.com/package/chai-http) and [co-mocha](https://www.npmjs.com/package/co-mocha) are loaded when using the test scripts described below.

### Test Containers

The tests are executed in test containers, which are specified in the `dc.test.yml` file.
These services typically inherit the services defined in `dc.dev.yml` but have a different name, e.g. `test-soyl-auth` instead of `soyl-auth`.
The objective is that the tests do not interfere with the regular containers nor with regular application data stored in volumes.
Where appropriate the test services should therefore override volume bindings, e.g. `./_volumes/test-auth-store/data:/data` to override `./_volumes/auth-store/data:/data`.

### Test Scripts

Unit tests can be started with the `scripts/test.<service>.sh` scripts.
These scripts are generated according to the declarations in the `cargo.yaml` files in the service templates.
To specify that a service can be unit-tested, you need to set the `unit-tests.enabled` property to true and provide the name of the test-service in the `unit-tests.service` property in the `cargo.yaml` file, like in the following example.
The default `unit-tests.enabled` value is `false`.

```
service: my-service
version: 0.0.1
cargoApp: true
cargoFrontend: false
watchable: true
unitTests:
  enable: true
  service: test-my-service
```

In most cases unit test are concerned with only one container.
However, sometimes additional containers should be running as well.
These additional services should be listed under the `unit-tests.dependencies` property in the `cargo.yaml` file.

In the following example, the `test-bar` service should also be started when testing `foo`.

```
service: foo
version: 0.0.1
cargoApp: true
cargoFrontend: false
watchable: true
unitTests:
  enable: true
  service: test-foo
  dependencies:
    - test-bar
```

Run `scripts/create-scripts.sh` to create the scripts.

Run `./test.build-all` to build all the test images.

Run `./test.all.sh` to run all the tests.

Run `./test.clean.sh` to remove all test assets.


### Stopping Containers

When the unit-tests for a service are all performed, Mocha will stop the main service container.
Additional 'dependant' services (declared as `unitTests.dependencies` in the `cargo.yaml`) need to stopped as well.
The test scripts therefore also require `cargo-lib/utils/fixtures/rootHooks.js`, which adds a root `after` hook that stops all dependant services.


### Running Select Tests

Typically there will be many tests for each service, yet when developing a new feature, you often only want to run the tests in one particular file.
There are several ways to do this, but the "prefered" way is by temporarily modifying the `dc.test.yml`.
If you only want to run the tests in the file `Foo.js` in the `test` directory of the `foo` service, then modify the `command` for the `test-foo` service, adding the test file path (relative to the service template root) as an additional argument.

```
command: [ "npm", "test", "test/Foo.js" ]
```

You can also add multiple test files as follow.

```
command: [ "npm", "test", "test/Foo.js", "test/Bar.js" ]
```


### Fixture Utilities

The Cargo-Lib provides the following testing fixture utilities in `cargo-lib/utils/fixtures`:

#### `failStatus(expectedStatus, axiosPromise)`
Takes a status code and a promise returned by axios.get/post/update/etc. and returns a promise that asserts that the request fails with the given status code. When these conditions are met, the promise resolves to undefined, or else rejects.

#### `succesStatus(expectedStatus, axiosPromise)`
Takes a status code and a promise returned by axios.get/post/update/etc. and returns a promise that asserts that the request succeeded with the given status code. When these conditions are met, the promise resolves to the result of the axios-promise, or else rejects.




----
__[[ Back ](../../README.md)]__



[Chai]: http://chaijs.com
[Docker Compose]: https://www.docker.com/products/docker-compose
[dockerode]: https://www.npmjs.com/package/dockerode
[Mocha]: https://mochajs.org
