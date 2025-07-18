# services/emotion.py

from typing import Dict, Any, Literal, Optional

# Provider seçimi: "mock", "speechbrain", "opensmile", "huggingface"
DEFAULT_PROVIDER: Literal["mock", "speechbrain", "opensmile", "huggingface"] = "mock"

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
            # Hızlı test, offline development veya dummy cevap için:
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
    """SpeechBrain ile gerçek emotion tespiti (multi-language, hazır model gerektirir)."""
    try:
        from speechbrain.pretrained import EncoderClassifier
        # Model yolunu/dilini seç (ör: Türkçe veya evrensel model)
        # Model dosyası yoksa speechbrain otomatik indirir.
        model = EncoderClassifier.from_hparams(source="speechbrain/emotion-recognition-wav2vec2-IEMOCAP")
        # Türkçe destekli model yoksa, İngilizce ile basic inference alınabilir
        out_probs, score, index, text_lab = model.classify_file(audio_path)
        # text_lab: [label], score: [score], out_probs: [[class_scores]]
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
    """openSMILE ile emotion extraction (CLI ile subprocess çalıştırılır, detaylı config gerekir)."""
    try:
        # openSMILE CLI ve config ile çalışır — çıktıdan etiketleri parse et
        # Bu bölüm, örnek olarak (prod için pipeline'da CLI call ile tamamlarsın)
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
        from transformers import pipeline
        classifier = pipeline("audio-classification", model="superb/hubert-large-superb-er")
        # Not: Türkçe için hazır model az, İngilizce için inference alınabilir.
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
