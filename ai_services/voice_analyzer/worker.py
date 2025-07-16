# worker.py

import time
from queue_manager import r, update_job_status
import random

def process_audio(data):
    """
    Şimdilik mock: gerçek analiz yerine örnek skorlar döner.
    """
    # Parametreleri oku
    audio_path = data.get(b"audio_path", b"").decode()
    # Mock output
    return {
        "speechRate": round(random.uniform(1.5, 4.0), 2),
        "energyMean": round(random.uniform(0.3, 1.0), 2),
        "energyStd": round(random.uniform(0.01, 0.15), 2),
        "prosodyScore": round(random.uniform(0.4, 0.9), 2),
        "confidenceScore": round(random.uniform(0.5, 1.0), 2),
        "dominantEmotion": random.choice(["neutral", "happy", "angry", "sad"]),
        "framesProcessed": random.randint(25, 40),
        "framesWithVoice": random.randint(20, 35),
        "processingTimeSec": round(random.uniform(0.1, 1.2), 2),
    }

def worker_loop():
    print("🔄 Voice Worker kuyruğu dinliyor...")
    while True:
        job_id = r.brpoplpush("voice_analysis_python", "voice_analysis_processing", timeout=0)
        if job_id:
            job_id = job_id.decode()
            print(f"🎤 İş alındı: {job_id}")
            update_job_status(job_id, "processing")
            data = r.hgetall(f"voice_job:{job_id}")
            try:
                result = process_audio(data)
                update_job_status(job_id, "done", result)
                print(f"✅ Job tamamlandı: {job_id}")
            except Exception as e:
                update_job_status(job_id, "failed", {"error": str(e)})
                print(f"❌ Job hata: {job_id} - {e}")
        else:
            print("⏸️ Kuyrukta iş yok, bekleniyor...")
            time.sleep(2)

if __name__ == "__main__":
    worker_loop()
