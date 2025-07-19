# services/audio_analysis.py

from services.energy import extract_energy
from services.pitch import extract_pitch
from services.emotion import extract_emotion

def analyze_voice_audio(audio_path: str, provider: str = "mock") -> dict:
    """
    Tüm ses analizlerini modüler çağırır, çıktıları tek dict’te birleştirir.
    Sadece teknik metrikler, hiçbir domain skoru, yorum, soft skill eklemez!
    """
    result = {}

    # 1. Teknik analizler (her biri dict döner, key’ler çakışmasın)
    energy_result = extract_energy(audio_path)
    pitch_result = extract_pitch(audio_path)
    emotion_result = extract_emotion(audio_path, provider=provider)

    # 2. Sonuçları birleştir (her fonksiyon null-safe, sabit key’lerle dönmeli)
    result.update(energy_result)
    result.update(pitch_result)
    result.update(emotion_result)


    return result
