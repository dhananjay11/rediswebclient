# PRedisFAngular
This project has two main pieces:  a JSON API, written in Python/Flask, and an AngularJS application.  


### PRedisFAngular JSON API server (in Python/Flask)
This is the endpoint which is pointed to in the configuration tab of the client application.  In this file, the Redis server connection is configured to point to your redis server.  

### PRedisFAngular Client (in AngularJS)
In this repo, the AngularJS application (in the /predfangy directory) can be started in Node.js by running `node server.js`. But, it can be served on the web server of your choice.
