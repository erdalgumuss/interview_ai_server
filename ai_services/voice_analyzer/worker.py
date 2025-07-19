#worker.py# voice_analyzer/worker.py

import time
from queue_manager import r, update_job_status
from models.input import VoiceAnalysisInput
from models.output import VoiceAnalysisOutput
from services.audio_analysis import analyze_voice_audio
import json

def process_audio(data):
    """
    Gerçek analiz: Redis’ten alınan job dict’ini VoiceAnalysisInput ile parse edip,
    analiz servisiyle işleyip, VoiceAnalysisOutput ile çıktıyı döndürür.
    """
    try:
        # Redis’ten gelen byte dict’i decode et
        data_dict = {k.decode(): v.decode() for k, v in data.items()}
        input_model = VoiceAnalysisInput(**data_dict)
        # Asıl analiz fonksiyonu
        result = analyze_voice_audio(
            audio_path=input_model.audio_path,
            provider=input_model.provider  # Diğer parametreleri de aktarabilirsin
        )
        output_model = VoiceAnalysisOutput(**result)
        return output_model.model_dump()
    except Exception as e:
        return {"error": str(e)}

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
                if "error" in result and result["error"]:
                    update_job_status(job_id, "failed", result)
                    print(f"❌ Job hata: {job_id} - {result['error']}")
                else:
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
