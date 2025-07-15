"""Geliştirici Notları:
Hata yönetimi: Dosya okunamadıysa veya frame alınamadıysa sebebiyle birlikte döner.

Logger opsiyonel, yoksa Python logging kullanır.

Frame yoksa (örn. bozuk dosya) skorlar 0 ve "error" alanı ile döner.

Kodun çıktısı tamamen öngörülebilir ve test edilebilir (MVP’ye uygun).

Genişletme: Dışarıdan logger veya debug/verbose parametre ile kolayca geliştirilir.

Uzun vadede: Çok büyük videolar veya paralel çalışmaya göre optimize edilebilir."""
# ai_services/face_analyzer/services/face_video.py


import time
from typing import Dict, Optional, Any, List
import logging
from services.emotion import analyze_emotion
from services.gaze import analyze_gaze
from services.stats import calculate_confidence_score, calculate_engagement_score
from utils.frame_sampler import sample_video_frames

def analyze_face_video(
    video_path: str,
    sampling_rate: float = 1.0,   # Kaç saniyede bir frame alınacak
    gaze_threshold: float = 0.1,  # Göz teması eşiği
    max_frames: Optional[int] = None,
    logger=None
) -> Dict[str, Any]:
    """
    Ana yüz analizi fonksiyonu.
    Video frame'lerini örnekler, duygu ve bakış tespiti yapar, skorlar döndürür.
    """
    logger = logger or logging.getLogger(__name__)
    start_time = time.time()

    try:
        frames = sample_video_frames(video_path, sampling_rate, max_frames=max_frames)
    except Exception as e:
        logger.error(f"[FaceAnalysis] Video okunamadı: {e}")
        return {
            "confidenceScore": 0,
            "engagementScore": 0,
            "eyeContactRatio": 0,
            "cameraAvoidanceCount": 0,
            "dominantEmotions": [],
            "framesProcessed": 0,
            "framesWithFace": 0,
            "framesWithEmotion": 0,
            "processingTimeSec": 0,
            "error": f"Video okunamadı: {str(e)}"
        }

    stats = {
        "emotions": [],
        "eye_contacts": 0,
        "avoidances": 0,
        "frames_with_face": 0,
        "frames_with_emotion": 0,
        "processed": 0,
    }

    if not frames:
        logger.warning("[FaceAnalysis] Hiç frame bulunamadı.")
        return {
            "confidenceScore": 0,
            "engagementScore": 0,
            "eyeContactRatio": 0,
            "cameraAvoidanceCount": 0,
            "dominantEmotions": [],
            "framesProcessed": 0,
            "framesWithFace": 0,
            "framesWithEmotion": 0,
            "processingTimeSec": round(time.time() - start_time, 2),
            "error": "Video boş veya işlenemedi."
        }

    # Ana analiz döngüsü
    for idx, frame in enumerate(frames):
        # 1. Duygu analizi
        emotion = analyze_emotion(frame)
        if emotion:
            stats["emotions"].append(emotion)
            stats["frames_with_emotion"] += 1

        # 2. Göz teması ve yön tespiti
        eye_contact, direction = analyze_gaze(frame, gaze_threshold)
        if eye_contact:
            stats["eye_contacts"] += 1
        if direction in ["left", "right"]:
            stats["avoidances"] += 1
        if eye_contact or direction != "undetected":
            stats["frames_with_face"] += 1
        stats["processed"] += 1

        if logger:
            logger.debug(
                f"[FaceAnalysis] Frame {idx}: emotion={emotion}, eye_contact={eye_contact}, direction={direction}"
            )

    elapsed = round(time.time() - start_time, 2)

    # 3. Dominant emotion belirleme
    dominant_emotions = []
    if stats["emotions"]:
        from collections import Counter
        dominant_emotions = [e for e, _ in Counter(stats["emotions"]).most_common(3)]

    # 4. Skor hesaplama
    processed = stats["processed"]
    eye_contact_ratio = (
        round(stats["eye_contacts"] / processed, 2) if processed else 0.0
    )
    confidenceScore = calculate_confidence_score(
        eye_contact_ratio, stats["avoidances"], dominant_emotions
    )
    engagementScore = calculate_engagement_score(
        eye_contact_ratio, dominant_emotions
    )

    # 5. Sonuç döndür
    return {
        "confidenceScore": confidenceScore,
        "engagementScore": engagementScore,
        "eyeContactRatio": eye_contact_ratio,
        "cameraAvoidanceCount": stats["avoidances"],
        "dominantEmotions": dominant_emotions,
        "framesProcessed": processed,
        "framesWithFace": stats["frames_with_face"],
        "framesWithEmotion": stats["frames_with_emotion"],
        "processingTimeSec": elapsed,
    }
