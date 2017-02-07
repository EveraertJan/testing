# Duxis Development on OS X

## Installing Docker

There are currently two options for using Docker on Mac (and Windows): [Docker Toolbox][] and [Docker Native][].
The Mupets system should in principle run on both, but in reality the Docker Toolbox set-up seems to work better.


### Installing Docker Toolbox

Install [Docker Toolbox][] (version 1.11.1 or higher) so that you can run Docker containers on a Mac localhost using a virtual machine (using [VirtualBox][]) as Docker host.
Consult [this page](http://docs.docker.com/engine/installation/mac/#mac-os-x) for more details.

Launch the _Docker Quickstart Terminal_ app.
The terminal should eventually say something like:
	
```
docker is configured to use the default machine with IP 192.168.99.100
```

Note down the _Docker host IP_ address at the tail of this message.
This is the IP address of the virtual machine in which the Docker containers run.

On OS X, the Docker host is not OS X but the virtual machine in which the Docker containers are run.
We thus need to access services exposed by the containers in this Docker host.
To facilitate this, add the following in your `/etc/hosts` file, replacing the IP address by the Docker host IP you noted down above.

```shell
192.168.99.100  fogg.dev api.fogg.dev pg.fogg.dev
```

The Soyl system uses the value of the environment variable `SOYL_HOST` as the hostname.
You should set it's value to `fogg.dev` in the `.env` file, like in the following example.
Consult [Dev/Build Set-Up](system-setup.md) for more details.

```shell
export SOYL_HOST=fogg.dev
```


### Docker Native

The Mupets server can be accessed on `localhost` when using the native Docker, but it is more convenient to provide a development hostname.
To do so, set the environment variable `SOYL_HOST` to `locahost` in the `.env` file, as follows.

```shell
export SOYL_HOST=fogg.dev
```

Also add the following hosts in your `/etc/hosts` file:

```shell
127.0.0.1  fogg.dev api.fogg.dev pg.fogg.dev
```



## Building

> First make sure that you have provided appropriate local configurations.
See [Dev/Build Set-Up](system-setup.md) for more details.

Build the images and other buildable assets in development mode:

```shell
$ ./build.dev.sh
```


## Running

Start the services:

```shell
$ ./up.dev.sh
```

You should be able to use the following command in a terminal to send a dummy log report to the server:

```shell
curl -H "Content-Type: application/json" -X POST \
  -d '{"client":"test","events":[{"type":"test","timestamp":"2012-13-14T15:16:17.189Z"}]}' \
  http://api.fogg.dev/report.json
```

When everything is ok, the log-service should (in v0.0.1) report that it received the log report as follows:

```shell
mupets-log-service_1  | [2016-03-06 16:37:49.589] [TRACE] log-service - POST /log/report.json: { client: 'playground',
mupets-log-service_1  |   events: [ { type: 'challengeCompleted', challenge: 'c1' } ] }
```

The log-archiver should report that it stored the log report as follows:

```shell
mupets-log-archiver_1 | [2016-03-06 16:37:50.069] [TRACE] log-archiver - # Created record { type: 'challengeCompleted',
mupets-log-archiver_1 |   challenge: 'c1',
mupets-log-archiver_1 |   client: 'playground',
mupets-log-archiver_1 |   '@rid': { [String: '#11:7'] cluster: 11, position: 7 },
mupets-log-archiver_1 |   '@version': 1 }
```

You should also be able to inspect the data in the OrientDB Studio at [http://orientdb.fogg.dev/](http://orientdb.fogg.dev/).
You can log in as `root` with the password specified in the `.env` file in the project's root directory. 

Under the _Browse_ tab you can get the list of stored log reports by entering the following SQL in the field at the top of the page, and hitting _Run_.

```sql
select * from LogEvent
```



----
__[[ Back ](../../README.md)]__



[Docker Compose]: https://www.docker.com/products/docker-compose
[Docker Native]: https://www.docker.com/products/docker
[Docker Toolbox]: https://www.docker.com/products/docker-toolbox
[VirtualBox]: https://www.virtualbox.org
