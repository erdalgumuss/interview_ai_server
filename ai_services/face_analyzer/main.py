"""
main.py - Face Analyzer Service Entry Point (MVP)

Yüz analizi API’sini başlatır. Tüm API endpointleri ayrı router’da toplanmıştır.
Servisin canlılığını kontrol etmek için /health endpointi içerir.
Kod, Docker ve local çalışma ortamlarında değişiklik gerektirmeden çalışır.

Geliştirici Notları:
- Production ortamı için config, logging ve CORS örnekleri kodun içinde açıklama olarak verilmiştir.
- Test/development için doğrudan çalıştırılabilir.
"""



from fastapi import FastAPI
from routes.face import router as face_router
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Face Analyzer Service",
    description="Analyzes facial expressions and eye contact in video interviews.",
    version=os.getenv("APP_VERSION", "0.1.0")
)

# Gerekirse CORS aç
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production'da domain belirt!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerlar
app.include_router(face_router, prefix="/face", tags=["Face Analysis"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
