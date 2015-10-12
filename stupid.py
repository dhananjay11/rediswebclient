import redis

r = redis.StrictRedis(host='192.168.1.117', port=6379, db=0)
def rruncommand(c):
    result = r.execute_command(c)
    return {"return": result.decode('utf8')}


print(rruncommand("set fart poop"))