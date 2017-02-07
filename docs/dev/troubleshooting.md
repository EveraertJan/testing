# Troubleshooting

## Networking issues

You observe issues such as:

- When retrieving an image, docker is not able to connect to the remote server.
- When building an image, npm is not able to connect to a remote server.
- Network communication between containers is excessively slow.
- Containers cannot connect to other containers.
- Containers cannot connect to hosts on the internet.

A first potential cause is that you are using a VPN using FortiClient (or other clients).
> Solution: Stop FortiClient and try again.

A second potential cause is that you have been putting your laptop to sleep, or taht you plugged in or removed the ethernet cable.

> Solution: Restart the Docker host by running:

```shell
docker-machine restart default
```

If the network issues persist after restarting the virtual machine, you may want to try to completely delete the virtual machine (in the _VirtualBox_ desktop application). If you then launch the _Docker Quickstart Termninal_ again, a new VM will be built. You will then need to rebuild the images.




----
__[[ Back ](../../README.md)]__



[Docker Compose]: https://www.docker.com/products/docker-compose

