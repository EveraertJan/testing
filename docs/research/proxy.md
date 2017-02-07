# Research: Proxy

> Documents the research into reverse proxy solutions.

## Problem Description

Several of the micro-services in the D2L2 system expose REST or WebSocket API's, either (or both) for public use or admin use. The public (and admin) API should be exposed externally on port 80 on a single host by means of single reverse proxy service.

Additional related functionalities to consider are:

- Load balancing : When under high load, the proxy service should be able to balance the load over multiple instances of the target service.

- Access control : Certain services might need to be access controlled. Should this access control be provide centrally? Should it then be integrated in the proxy service? Or should access control be implemented in a distributed fashion, where each service handles it's own access control?

- Integration with Docker container systen : 


## Requirements

- REQ-01 [critical] : Support reverse proxy for HTTP request/reply.

- REQ-02 [critical] : Support reverse proxy for WebSockets.

- REQ-03 [critical] : Support load balancing.

- REQ-04 [critical] : Support SSL.

- REQ-05 : Provide API to dynamically edit proxy forwarding and load balancing.

- REQ-06 : Integration with Docker.



## Solutions

### Requirements Support Table

|     | NGINX | HAProxy | Traefic |
| --- |:-----:|:-------:|:-------:|
| Dynamic configuration   ||| Yes |
| Integration with Docker ||| Yes |


### NGINX

- NGINX can act as a reverse proxy and do load balancing of WebSocket applications.



### HAProxy

- URL: [http://www.haproxy.org](http://www.haproxy.org)
- Supports proxying, load balancing


### Traefic

- URL: [https://docs.traefik.io/](https://docs.traefik.io/)
- 