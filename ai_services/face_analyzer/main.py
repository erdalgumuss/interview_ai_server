from fastapi import FastAPI
from routes.face import router as face_router

app = FastAPI(
    title="Face Analyzer Service",
    description="Analyzes facial expressions and eye contact in video interviews.",
    version="0.1.0"
)

# Router dahil et
app.include_router(face_router, prefix="/face", tags=["Face Analysis"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
