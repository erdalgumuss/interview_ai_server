"""
main.py - Face Analyzer Service Entry Point (MVP)

Yüz analizi API’sini başlatır. Tüm API endpointleri ayrı router’da toplanmıştır.
Servisin canlılığını kontrol etmek için /health endpointi içerir.
Kod, Docker ve local çalışma ortamlarında değişiklik gerektirmeden çalışır.

Geliştirici Notları:
- Production ortamı için config, logging ve CORS örnekleri kodun içinde açıklama olarak verilmiştir.
- Test/development için doğrudan çalıştırılabilir.


Mikroservis, işi bloklamaz; hızlıca jobId döner.

Kuyruk yöneticisi (örn. ayrı Python scripti veya Celery worker) sıradaki job’ları çeker, işlemi başlatır, sonucu/ara statüyü Redis’e/Mongo’ya kaydeder.

Statü endpointi ile anlık durum çekilebilir (API polling veya dashboard için uygun).

Sonuç üretildiğinde, client veya ana server iş bitti mi diye status’a bakar.

Kritik durumlarda Webhook/event tetikleme de eklenebilir (örn. job bittiğinde başka sisteme haber ver).
"""


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from queue_manager import enqueue_job, get_job_status
import os

app = FastAPI(
    title="Face Analyzer Service",
    description="Asenkron yüz analizi kuyruğu.",
    version=os.getenv("APP_VERSION", "0.1.0")
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.post("/face/analyze")
async def analyze_face(request: Request):
    data = await request.json()
    job_id = enqueue_job(data)  # Sadece kuyruğa atıyor!
    return {"jobId": job_id, "status": "queued"}

@app.get("/face/status/{job_id}")
def status(job_id: str):
    return get_job_status(job_id)

@app.get("/health")
def health():
    return {"status": "ok"}
