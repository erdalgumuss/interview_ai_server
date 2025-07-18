# services/score_calculator.py

# (Gerekirse config/score_weights.py ile normalizasyon katsayılarını ayırabilirsin)
SCORE_WEIGHTS = {
    "energy": 30,
    "pitch_std": 50,
    "voice_break": 2
}
SCORE_THRESHOLDS = {
    "comm_energy_ok": 0.4,
    "fluency_ok": 0.7,
    "monotony_ok": 0.6
}

def calculate_soft_skills(features: dict, lang: str = "tr") -> dict:
    """
    Teknik analiz verilerini (energy, pitch, emotion...) soft-skill skorlarına ve rapora çevirir.
    """
    try:
        energy = features.get("energyMean", 0)
        pitch_std = features.get("pitchStd", 0)
        voice_break = features.get("voiceBreakRatio", 0)
        emotion = features.get("emotionLabel", "neutral")
        emotion_scores = features.get("emotionScores", {})
        # Gelişmiş emotion için: dominant_prob = max(emotion_scores.values()) vb.

        # Skorlar
        comm_energy = min(1.0, energy * SCORE_WEIGHTS["energy"])
        monotony = 1.0 - min(1.0, pitch_std / SCORE_WEIGHTS["pitch_std"])
        fluency = 1.0 - min(1.0, voice_break * SCORE_WEIGHTS["voice_break"])
        emotion_score = {
            "neutral": 0.5, "happy": 1.0, "sad": 0.2, "angry": 0.2
        }.get(emotion, 0.5)

        # Yorumlar
        interpretations = {
            "communicationEnergy": (
                "Ses enerjisi yeterli." if comm_energy > SCORE_THRESHOLDS["comm_energy_ok"]
                else "Ses enerjisi düşük, motivasyon eksik görünebilir."
            ),
            "speechFluency": (
                "Akıcı konuşma." if fluency > SCORE_THRESHOLDS["fluency_ok"]
                else "Konuşmada çok fazla duraksama var."
            ),
            "monotony": (
                "Ses tonu çeşitli, monoton değil." if monotony > SCORE_THRESHOLDS["monotony_ok"]
                else "Ses tonu monoton olabilir."
            ),
            "emotion": f"Duygu tespiti: {emotion}."
        }

        # Risks/Öneriler
        risks = []
        if comm_energy < 0.3: risks.append("Düşük ses enerjisi, özgüven sorunu olabilir.")
        if monotony < 0.5: risks.append("Monoton ton, heyecan veya motivasyon eksikliği göstergesi olabilir.")
        if fluency < 0.5: risks.append("Konuşma akıcılığı çok düşük.")

        overall = (
            "Adayın iletişim becerisi genel olarak yeterli."
            if comm_energy > 0.4 and fluency > 0.6
            else "Adayın iletişim ve ses enerjisi geliştirilmeli."
        )

        return {
            "softSkillScores": {
                "communicationEnergy": round(comm_energy, 2),
                "speechFluency": round(fluency, 2),
                "monotony": round(monotony, 2),
                "emotionScore": round(emotion_score, 2)
            },
            "interpretations": interpretations,
            "risks": risks,
            "overallRecommendation": overall
        }
    except Exception as e:
        return {
            "softSkillScores": {},
            "interpretations": {},
            "risks": [],
            "overallRecommendation": "",
            "error": str(e)
        }
