# ai_services/face_analyzer/worker.py
import time
import os
from services.face_video import analyze_face_video
from queue_manager import r

def process_video(data):
    """
    Gerçek analiz fonksiyonu.
    data: Redis hash dict (binary key/value)
    """
    # Gerekli inputları çek
    video_path = data.get(b"video_path", b"").decode()
    # Geliştirilebilecek: sampling_rate, gaze_threshold, max_frames parametreleri (daha sonra eklenebilir)
    # Basit örnek için varsayılanlarla çalışıyoruz
    result = analyze_face_video(
        video_path,
        sampling_rate=float(data.get(b"sampling_rate", b"1.0").decode() if data.get(b"sampling_rate") else 1.0),
        gaze_threshold=float(data.get(b"gaze_threshold", b"0.1").decode() if data.get(b"gaze_threshold") else 0.1),
        max_frames=int(data.get(b"max_frames", b"30").decode() if data.get(b"max_frames") else 30)
    )
    return result
def update_job_status(job_id: str, status: str, extra: dict = None):
    """
    Bir işin durumunu ve opsiyonel ekstra bilgileri günceller.
    """
    d = {"status": status}
    if extra:
        d.update({k: str(v) for k, v in extra.items()})
    r.hset(f"face_job:{job_id}", mapping=d)

def worker_loop():
    print("🔄 Worker kuyruğu dinliyor...")
    while True:
        # Kuyruğun başından iş çek
        job_id = r.brpoplpush("face_analaysis_python", "face_analysis_processing", timeout=0)
        if job_id:
            job_id = job_id.decode()
            print(f"🎬 İş alındı: {job_id}")
            update_job_status(job_id, "processing")
            data = r.hgetall(f"face_job:{job_id}")  # Redis hash olarak input
            try:
                result = process_video(data)
                update_job_status(job_id, "done", result)
                print(f"✅ Job tamamlandı: {job_id}")
            except Exception as e:
                update_job_status(job_id, "failed", {"error": str(e)})
                print(f"❌ Job hata: {job_id} - {e}")
            # (Opsiyonel: İş bittiğinde processing listesinden çıkarabilirsin)
        else:
            print("⏸️ Kuyrukta iş yok, bekleniyor...")
            time.sleep(2)

if __name__ == "__main__":
    worker_loop()
