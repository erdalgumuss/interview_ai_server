import time
from typing import Dict, Optional, Any, List
from services.emotion import analyze_emotion
from services.gaze import analyze_gaze
from services.stats import calculate_confidence_score, calculate_engagement_score
from utils.frame_sampler import sample_video_frames

def analyze_face_video(
    video_path: str,
    sampling_rate: float = 1.0,  # Saniyede bir frame
    gaze_threshold: float = 0.1,
    max_frames: Optional[int] = None,
    logger=None
) -> Dict[str, Any]:
    start_time = time.time()
    frames = sample_video_frames(video_path, sampling_rate, max_frames=max_frames)
    stats = {
        "emotions": [],
        "eye_contacts": 0,
        "avoidances": 0,
        "frames_with_face": 0,
        "frames_with_emotion": 0,
        "processed": 0,
    }

    for idx, frame in enumerate(frames):
        # Duygu analizi
        emotion = analyze_emotion(frame)
        if emotion:
            stats["emotions"].append(emotion)
            stats["frames_with_emotion"] += 1

        # Göz teması ve yön tespiti
        eye_contact, direction = analyze_gaze(frame, gaze_threshold)
        if eye_contact:
            stats["eye_contacts"] += 1
        if direction in ["left", "right"]:
            stats["avoidances"] += 1
        if eye_contact or direction != "undetected":
            stats["frames_with_face"] += 1
        stats["processed"] += 1

        if logger:
            logger.debug(f"Frame {idx}: emotion={emotion}, eye_contact={eye_contact}, direction={direction}")

    elapsed = round(time.time() - start_time, 2)

    dominant_emotions = []
    if stats["emotions"]:
        from collections import Counter
        dominant_emotions = [e for e, _ in Counter(stats["emotions"]).most_common(3)]

    eye_contact_ratio = (
        round(stats["eye_contacts"] / stats["processed"], 2) if stats["processed"] else 0.0
    )
    confidenceScore = calculate_confidence_score(
        eye_contact_ratio, stats["avoidances"], dominant_emotions
    )
    engagementScore = calculate_engagement_score(
        eye_contact_ratio, dominant_emotions
    )

    return {
        "confidenceScore": confidenceScore,
        "engagementScore": engagementScore,
        "eyeContactRatio": eye_contact_ratio,
        "cameraAvoidanceCount": stats["avoidances"],
        "dominantEmotions": dominant_emotions,
        "framesProcessed": stats["processed"],
        "framesWithFace": stats["frames_with_face"],
        "framesWithEmotion": stats["frames_with_emotion"],
        "processingTimeSec": elapsed,
    }
