from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class SoftSkillScores(BaseModel):
    communicationEnergy: float
    speechFluency: float
    monotony: float
    emotionScore: float

class VoiceAnalysisOutput(BaseModel):
    speechRate: Optional[float] = None
    energyMean: Optional[float] = None
    energyStd: Optional[float] = None
    energyMax: Optional[float] = None
    energyMin: Optional[float] = None
    pitchMean: Optional[float] = None
    pitchStd: Optional[float] = None
    dominantEmotion: Optional[str] = None
    emotionScores: Optional[Dict[str, float]] = None
    softSkillScores: Optional[SoftSkillScores] = None
    interpretations: Optional[Dict[str, str]] = None
    risks: Optional[Any] = None
    overallRecommendation: Optional[str] = None
    framesProcessed: Optional[int] = None
    framesWithVoice: Optional[int] = None
    processingTimeSec: Optional[float] = None
    error: Optional[str] = None
