# queue_manager.py
import redis
import uuid
import os
import json

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB   = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def enqueue_job(data: dict) -> str:
    job_id = str(uuid.uuid4())
    redis_data = {"status": "queued"}
    # JSON serialize complex values:
    for k, v in data.items():
        try:
            redis_data[k] = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
        except Exception:
            redis_data[k] = str(v)
    r.hset(f"voice_job:{job_id}", mapping=redis_data)
    r.lpush("voice_analysis_python", job_id)
    # Expire key after 24h
    r.expire(f"voice_job:{job_id}", 24 * 3600)
    return job_id

def get_job_status(job_id: str) -> dict:
    info = r.hgetall(f"voice_job:{job_id}")
    if not info:
        return {"error": "job not found"}
    result = {}
    for k, v in info.items():
        try:
            val = v.decode()
            # Try to JSON parse if possible
            if val.startswith("{") or val.startswith("["):
                val = json.loads(val)
            result[k.decode()] = val
        except Exception:
            result[k.decode()] = v.decode(errors="ignore")
    return result

def update_job_status(job_id: str, status: str, extra: dict = None):
    d = {"status": status}
    if extra:
        for k, v in extra.items():
            try:
                d[k] = json.dumps(v) if isinstance(v, (dict, list)) else str(v)
            except Exception:
                d[k] = str(v)
    r.hset(f"voice_job:{job_id}", mapping=d)
    # Touch TTL
    r.expire(f"voice_job:{job_id}", 24 * 3600)
