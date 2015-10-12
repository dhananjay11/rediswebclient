from flask import Flask, jsonify, request
from flask.ext.cors import CORS
import redis
import random
import time
import json


app = Flask(__name__)
CORS(app)

REDIS_CONNECTION = redis.StrictRedis(host='192.168.1.117', port=6379, db=0)
r = REDIS_CONNECTION


@app.route('/rget', methods=['GET'])
def rget():
    result = {}
    k = request.args.get('key')
    if k is not None:
        try:
            v = r.get(k)
            result[k] = v.decode('utf8')
        except redis.exceptions.ResponseError:
            v = '***  WRONGTYPE Operation against a key holding the wrong kind of value  ***'
            result[k] = v
    return jsonify(result)


@app.route('/rset', methods=['POST'])
def rset():
    fd = request.json
    k = fd['key']
    v = fd['val']
    status = False
    if k not in ('', None) and v not in ('', None):
        status = r.set(k, v)
    result = {'status': status}
    print(status)
    return jsonify(result)


@app.route('/rdel', methods=['POST'])
def rdel():
    status = r.delete(request.json['key'])
    result = {"status": status}
    return jsonify(result)


@app.route('/rflush', methods=['GET'])
def rflush():
    status = r.flushall()
    result = {"status": status}
    return jsonify(result)


@app.route('/rlist', methods=['GET'])
def rlist():
    keys = {}
    keys["keys"] = [x.decode('utf8') for x in r.keys()]
    return jsonify(**keys)


@app.route('/rjunk', methods=['GET'])
def rjunk():
    i = 0
    while i <= 100:
        i += 1
        rk = random.random()
        r.set(rk, random.random())
        r.expire(rk, 300)
    return jsonify({"status": "success"})


@app.route('/rexpsecs', methods=['POST'])
def rjunk():
    fd = request.json
    k = fd['key']
    e = fd['exp']
    r.expire(k, int(e))
    return jsonify({"status": "success"})



if __name__ == '__main__':
    app.debug = True
    app.run()
