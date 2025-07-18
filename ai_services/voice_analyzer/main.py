from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.input import VoiceAnalysisInput   # 👈
from queue_manager import enqueue_job, get_job_status
import os

app = FastAPI(
    title="Voice Analyzer Service",
    description="Asenkron ses analizi kuyruğu.",
    version=os.getenv("APP_VERSION", "0.1.0")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

@app.post("/voice/analyze")
async def analyze_voice(input: VoiceAnalysisInput):  # 👈 Tip belirle!
    # input: Pydantic model, otomatik validasyon + OpenAPI doc
    job_id = enqueue_job(input.dict())
    return {"jobId": job_id, "status": "queued"}

@app.get("/voice/status/{job_id}")
def status(job_id: str):
    return get_job_status(job_id)

@app.get("/health")
def health():
    return {"status": "ok"}
