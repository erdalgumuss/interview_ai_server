from pydantic import BaseModel, Field
from typing import Optional, Dict

class VoiceAnalysisOutput(BaseModel):
    speechRate: Optional[float] = None
    energyMean: Optional[float] = None
    energyStd: Optional[float] = None
    energyMax: Optional[float] = None
    energyMin: Optional[float] = None
    pitchMean: Optional[float] = None
    pitchStd: Optional[float] = None
    pitchMin: Optional[float] = None
    pitchMax: Optional[float] = None
    voiceBreakRatio: Optional[float] = None
    vadFrames: Optional[int] = None
    nonVadFrames: Optional[int] = None
    clippingRatio: Optional[float] = None
    snrEstimate: Optional[float] = None
    dominantEmotion: Optional[str] = None
    emotionScores: Optional[Dict[str, float]] = None
    framesProcessed: Optional[int] = None
    framesWithVoice: Optional[int] = None
    processingTimeSec: Optional[float] = None
    error: Optional[str] = None
