from pydantic import BaseModel, Field
from typing import List

class FaceOutput(BaseModel):
    confidenceScore: int = Field(..., ge=0, le=100, description="Estimated confidence level (0-100)")
    engagementScore: int = Field(..., ge=0, le=100, description="Estimated attention/interest level (0-100)")
    eyeContactRatio: float = Field(..., ge=0.0, le=1.0, description="Ratio of time with direct eye contact (0.0–1.0)")
    cameraAvoidanceCount: int = Field(..., ge=0, description="Count of times the candidate clearly looked away")
    dominantEmotions: List[str] = Field(..., description="Most frequent detected emotions during the answer")
