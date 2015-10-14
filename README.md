# PRedisFAngular
This project has two main pieces:  a JSON API, written in Python/Flask, and an AngularJS application.  


### Step 1: Initial Setup
FIrst, if you have not already, install Python3, python-virtualenv, Node.js, and npm.  Then, from the top level directory, run the following commands:
```
virtualenv -p python3 venv
. venv/bin/activate
pip install -r requirements.txt
cd predfangy
npm install
```

### Step 2: PRedisFAngular JSON API server (in Python/Flask)
This is the endpoint which is pointed to in the configuration tab of the client application.  In this file, the Redis server connection is configured to point to your redis server.
Start the server with `python predfangy.py`, then see the next section.

### Step 3: PRedisFAngular Client (in AngularJS)
In this repo, the AngularJS application (in the /predfangy directory) can be started in Node.js by running `node predfangy/server.js`.  This can be hosted on the web server of your choice.
