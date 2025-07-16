# queue_manager.py

import redis
import uuid
import os

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB   = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def enqueue_job(data: dict) -> str:
    job_id = str(uuid.uuid4())
    redis_data = {"status": "queued"}
    redis_data.update({k: str(v) for k, v in data.items()})
    r.hset(f"voice_job:{job_id}", mapping=redis_data)
    r.lpush("voice_analysis_python", job_id)
    return job_id

def get_job_status(job_id: str) -> dict:
    info = r.hgetall(f"voice_job:{job_id}")
    if not info:
        return {"error": "job not found"}
    return {k.decode(): v.decode() for k, v in info.items()}

def update_job_status(job_id: str, status: str, extra: dict = None):
    d = {"status": status}
    if extra:
        d.update({k: str(v) for k, v in extra.items()})
    r.hset(f"voice_job:{job_id}", mapping=d)
