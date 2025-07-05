import redis
import uuid
import os

# Ortak Redis bağlantısı (env ile ayarlanabilir)
REDIS_HOST = os.getenv("REDIS_HOST", "redis")      # docker-compose için 'redis'
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB   = int(os.getenv("REDIS_DB", 0))

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)

def enqueue_job(data: dict) -> str:
    """
    Kuyruğa yeni iş ekler. data: {'video_path': ..., 'sampling_rate': ..., ...}
    Dönüş: job_id (string)
    """
    job_id = str(uuid.uuid4())
    # Extra key-value'ları status ile birlikte kaydet
    redis_data = {"status": "queued"}
    redis_data.update({k: str(v) for k, v in data.items()})
    r.hset(f"face_job:{job_id}", mapping=redis_data)
    r.lpush("face_analysis_queue", job_id)
    return job_id

def get_job_status(job_id: str) -> dict:
    """
    Bir işin tüm bilgilerini ve son durumunu döndürür.
    """
    info = r.hgetall(f"face_job:{job_id}")
    if not info:
        return {"error": "job not found"}
    return {k.decode(): v.decode() for k, v in info.items()}

def update_job_status(job_id: str, status: str, extra: dict = None):
    """
    Bir işin durumunu ve opsiyonel ekstra bilgileri günceller.
    """
    d = {"status": status}
    if extra:
        d.update({k: str(v) for k, v in extra.items()})
    r.hset(f"face_job:{job_id}", mapping=d)
