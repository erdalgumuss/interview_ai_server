# services/audio_analysis.py

from services.energy import extract_energy
from services.pitch import extract_pitch
from services.emotion import extract_emotion
from services.score_calculator import calculate_soft_skills

def analyze_voice_audio(audio_path: str, provider: str = "mock") -> dict:
    """
    Tüm ses analizlerini modüler çağırır ve çıktıyı birleştirir.
    Sonuçları soft-skill skoruna dönüştürür.
    """
    result = {}

    # 1. Teknik analizler
    energy_result = extract_energy(audio_path)
    pitch_result = extract_pitch(audio_path)
    emotion_result = extract_emotion(audio_path, provider=provider)

    # 2. Sonuçları birleştir
    result.update(energy_result)
    result.update(pitch_result)
    result.update(emotion_result)

    # 3. Soft-skill scoring ve yorumlar
    result["softSkills"] = calculate_soft_skills(result)

    return result
