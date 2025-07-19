from pydantic import BaseModel, Field

class VoiceAnalysisInput(BaseModel):
    audio_path: str = Field(..., description="İşlenecek ses dosyasının tam yolu")
    # İleride ek parametreler:
    sampling_rate: int = Field(16000, description="Opsiyonel: Hedef örnekleme oranı (Hz)")
    language: str = Field("tr", description="Dil (ör: 'tr', 'en')")
    provider: str = Field("huggingface", description="Duygu analizi için provider (örn. mock, speechbrain, huggingface)")
    # vs.
