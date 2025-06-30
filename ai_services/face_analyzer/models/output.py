from pydantic import BaseModel, Field
from typing import List

class FaceOutput(BaseModel):
    confidenceScore: float = Field(..., ge=0, le=100)
    engagementScore: float = Field(..., ge=0, le=100)
    eyeContactRatio: float = Field(..., ge=0.0, le=1.0)
    cameraAvoidanceCount: float = Field(..., ge=0)
    dominantEmotions: List[str]
    framesProcessed: int = Field(..., ge=0)
    framesWithFace: int = Field(..., ge=0)
    framesWithEmotion: int = Field(..., ge=0)
    processingTimeSec: float = Field(..., ge=0)
