# services/emotion.py

from typing import Dict, Any, Literal, Optional

# Provider seçimi: "mock", "speechbrain", "opensmile", "huggingface"
DEFAULT_PROVIDER: Literal["mock", "speechbrain", "opensmile", "huggingface"] = "mock"

# ---- GLOBAL MODEL NESNELERİ ----
_speechbrain_model = None
_hf_classifier = None

# ---- LAZY LOAD FONKSİYONLARI ----
def _get_speechbrain_model():
    global _speechbrain_model
    if _speechbrain_model is None:
        print("[INFO] SpeechBrain emotion model loading...")
        from speechbrain.pretrained import EncoderClassifier
        _speechbrain_model = EncoderClassifier.from_hparams(
            source="speechbrain/emotion-recognition-wav2vec2-IEMOCAP"
        )
    return _speechbrain_model

def _get_hf_classifier():
    global _hf_classifier
    if _hf_classifier is None:
        print("[INFO] HuggingFace audio-classification pipeline loading...")
        from transformers import pipeline
        _hf_classifier = pipeline(
            "audio-classification", model="superb/hubert-large-superb-er"
        )
    return _hf_classifier

# ---- ANA ARAYÜZ ----
def extract_emotion(
    audio_path: str,
    provider: Optional[str] = None,
    language: str = "tr"
) -> Dict[str, Any]:
    """
    Ses dosyasından duygu tespiti.
    Tüm provider’lar için tek arayüz.
    """
    provider = provider or DEFAULT_PROVIDER
    try:
        if provider == "mock":
            return _extract_emotion_mock(audio_path)
        elif provider == "speechbrain":
            return _extract_emotion_speechbrain(audio_path, language)
        elif provider == "opensmile":
            return _extract_emotion_opensmile(audio_path, language)
        elif provider == "huggingface":
            return _extract_emotion_hf(audio_path, language)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    except Exception as e:
        return {
            "emotionLabel": "unknown",
            "emotionScores": {},
            "error": str(e)
        }

# ---- PROVIDER IMPLEMENTASYONLARI ----

def _extract_emotion_mock(audio_path: str) -> Dict[str, Any]:
    """Mock (stub) duygu analizi (her zaman neutral döner, geliştirme/test için)."""
    return {
        "emotionLabel": "neutral",
        "emotionScores": {
            "neutral": 0.85,
            "happy": 0.05,
            "sad": 0.05,
            "angry": 0.05
        },
        "error": None
    }

def _extract_emotion_speechbrain(audio_path: str, language: str = "tr") -> Dict[str, Any]:
    """SpeechBrain ile gerçek emotion tespiti."""
    try:
        model = _get_speechbrain_model()
        out_probs, score, index, text_lab = model.classify_file(audio_path)
        label = text_lab[0] if text_lab else "unknown"
        class_probs = out_probs[0] if out_probs is not None and len(out_probs) > 0 else []
        emotion_labels = model.hparams.label_encoder.decode_ndim([[i for i in range(len(class_probs))]])[0]
        scores_dict = {lbl: float(prob) for lbl, prob in zip(emotion_labels, class_probs)}
        return {
            "emotionLabel": label,
            "emotionScores": scores_dict,
            "error": None
        }
    except Exception as e:
        return {
            "emotionLabel": "unknown",
            "emotionScores": {},
            "error": f"SpeechBrain: {e}"
        }

def _extract_emotion_opensmile(audio_path: str, language: str = "tr") -> Dict[str, Any]:
    """openSMILE ile emotion extraction (CLI ile subprocess çalıştırılır)."""
    try:
        # openSMILE CLI ve config ile çalışır — çıktıdan etiketleri parse et
        raise NotImplementedError("openSMILE entegrasyonu henüz eklenmedi.")
    except Exception as e:
        return {
            "emotionLabel": "unknown",
            "emotionScores": {},
            "error": f"openSMILE: {e}"
        }

def _extract_emotion_hf(audio_path: str, language: str = "tr") -> Dict[str, Any]:
    """HuggingFace üzerinden model ile emotion extraction (destek varsa)."""
    try:
        classifier = _get_hf_classifier()
        res = classifier(audio_path)
        if not res:
            raise ValueError("No result from HuggingFace classifier.")
        label = res[0]['label']
        scores = {r['label']: float(r['score']) for r in res}
        return {
            "emotionLabel": label,
            "emotionScores": scores,
            "error": None
        }
    except Exception as e:
        return {
            "emotionLabel": "unknown",
            "emotionScores": {},
            "error": f"HuggingFace: {e}"
        }
