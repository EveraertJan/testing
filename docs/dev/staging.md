# Staging on `tocker.iminds.be`

## Installing

The configuration details of the installation on _tocker.iminds.be_ are maintained in
[Confluence > Using tocker.iminds.be](https://iminds.atlassian.net/wiki/display/developers/Using+tocker.iminds.be). The following are the steps taken to install _mupets-server_ on tocker, following the instructions in the section _Initializing a new project on tocker.iminds.be_.

Log in: `$ ssh sysadmin@tocker.iminds.be`

Sudo to root: `$ sudo -s`

Create a dedicated user and group (per the instructions for iLab.o).

```shell
$ sudo groupadd mupets
$ sudo useradd -m -g mupets -s /bin/bash mupets
$ sudo passwd mupets
```

Add the new user in the docker group to allow this user to use docker.

```shell
$ usermod -aG docker mupets
```

Log out and log back in as _mupets_.

```shell
$ exit

$ ssh mupets@tocker.iminds.be
```

Create the project directory if it does not already exists.

```shell
$ mkdir /home/fogg/
```

Set the `SOYL_HOST` and other environment variables in the `.env` file.
See the _Configuration_ section below for more details.

Create an `id_rsa` key (without passphrase) which we will use to retrieve the project from the _bitbucket_ repository.

```shell
$ ssh-keygen -t rsa
```

Add the public key (`/home/fogg/.ssh/id_rsa.pub`) in the `mupets-server` _bitbucket_ repository. See [Atlassian's documentation](https://confluence.atlassian.com/bitbucket/add-an-ssh-key-to-an-account-302811853.html) for more details.

Clone the _mupets-server_ repository, replacing `<branch>` with the desired branch name.

```shell
$ git clone -b <branch> ssh://git@bitbucket.org/iminds/mupets-server.git
```


## Building

First set the desired environment variables in the `.env` file.

Now run the build script.

```shell
$ ./build.sh
```


## Running

Start the Mupets server.

```shell
$ ./start.sh
```

You should be able to use the following command in a terminal to send a dummy log report to the server:

```shell
curl -H "Content-Type: application/json" -X POST \
  -d '{"client":"test","events":[{"type":"test","timestamp":"2012-13-14T15:16:17.189Z"}]}' \
  http://api.fogg.tocker.iminds.be/report.json
```

```shell
curl -H "Content-Type: application/json" -X POST \
  -d '{"client":"test","events":[{"type":"test","timestamp":"2012-13-14T15:16:17.189Z","data":{"k1":"v1","k2":"v2"}}]}' \
  http://api.fogg.tocker.iminds.be/report.json
```

When everything is ok, the log-service should (in v0.0.1) report that it received the log report as follows:

```shell
mupets-log-service_1  | [2016-03-06 16:37:49.589] [TRACE] log-service - POST /log/report.json: { client: 'test', ... }
```

The log-archiver should report that it stored the log report as follows:

```shell
mupets-log-archiver_1 | [2016-03-06 16:37:50.069] [TRACE] log-archiver - # Created record { type: 'test',
mupets-log-archiver_1 |   timestamp: '2012-13-14T15:16:17.189Z',
mupets-log-archiver_1 |   client: 'test',
mupets-log-archiver_1 |   '@rid': { [String: '#11:7'] cluster: 11, position: 7 },
mupets-log-archiver_1 |   '@version': 1 }
```

You should also be able to inspect the data in the OrientDB Studio at [http://tocker.iminds.be:4011/](http://tocker.iminds.be:4011/) from within the iMinds network. You can log in as `root` with the password specified in `docker-compoer.yml` (`rootpass` in the default configuration). 

Under the _Browse_ tab you can get the list of stored log reports by entering the following SQL in the field at the top of the page, and hitting _Run_.

	select * from LogEvent



## Updating

Change into project root.

Revert all local uncommitted changes.

```shell
git checkout .
```

Pull latest commits from the repository.

```shell
git pull
```


----
__[[ Back ](../../README.md)]__



[Docker Compose]: https://www.docker.com/products/docker-compose
