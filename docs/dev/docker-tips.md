# Docker Tips

## Inspecting the containers

```shell
$ docker ps -l
```

## Inspecting the content of a container

Use the `inspect.*.sh` scripts in the `scripts` directory.

Alternatively, you can inspect the content of a container by entering the bash shell in the container. The following example enters the bash shell in the container named `master_soyl-admin_1`. This name is automatically assigned to the container based on the image for the `soyl-admin` container template.

```shell
docker exec -ti master_soyl-admin_1 /bin/bash
```

You can also use the `inspect-*.js` scripts in the `./scripts` directory.

After starting the containers, you can get the names of the running containers with the following instruction.

```shell
docker ps
```

Add `-a` to list all containers and add `-s` to show the size of all running container, or `-sa` to do both.

```shell
docker ps -sa
```

Note that the _alpine_ and _nginx:alpine_ images do not install _Bash_ by default.


## Shutting down

When starting the infrastructure cluster as described above, the cluster should shut down when exiting the terminal with `CTRL-C`.

Restart the server:

	$ ./restart.sh

Stop the containers:

	$ docker-compose stop

Stop and remove all containers:

	$ docker rm -f $(docker ps -a -q)

Remove the `soyl` network:

	$ docker network rm soyl

Remove all dangling images

	$ docker rmi $(docker images -q -f dangling=true)

Remove all images

	$ docker rmi $(docker images -q)

Stop the host vm:

	$ docker-machine stop default


## Docker Remote API

Get all containers:
```
curl -v --unix-socket /var/run/docker.sock http:/containers/json?all=1
```








----
__[[ Back ](../../README.md)]__



[Docker Compose]: https://www.docker.com/products/docker-compose
