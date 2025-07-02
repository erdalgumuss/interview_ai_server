import cv2
import numpy as np
import mediapipe as mp

from deepface import DeepFace
from collections import Counter
from typing import Tuple
from ai_services.face_analyzer.services.old_code.score_utils import calculate_confidence_score, calculate_engagement_score

def analyze_face_video(video_path: str) -> dict:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Video cannot be opened.")

    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    emotions = []
    eye_contacts = 0
    avoidances = 0
    processed = 0

    for i in range(0, total_frames, int(frame_rate)):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            continue
        try:
            # Duygu analizi (DeepFace)
            result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
            emotion = result[0]['dominant_emotion']
            emotions.append(emotion)
        except:
            pass

        try:
            eye_contact, direction = detect_eye_contact(frame)
            if eye_contact:
                eye_contacts += 1
            if direction in ["left", "right"]:
                avoidances += 1
        except:
            pass

        processed += 1

    cap.release()

    dominant_emotions = [e for e, _ in Counter(emotions).most_common(3)]
    eye_contact_ratio = round(eye_contacts / processed, 2) if processed else 0.0
    confidenceScore = calculate_confidence_score(eye_contact_ratio, avoidances, dominant_emotions)
    engagementScore = calculate_engagement_score(eye_contact_ratio, dominant_emotions)

    return {
        "confidenceScore": confidenceScore,
        "engagementScore": engagementScore,
        "eyeContactRatio": eye_contact_ratio,
        "cameraAvoidanceCount": avoidances,
        "dominantEmotions": dominant_emotions
    }



mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

def detect_eye_contact(frame: np.ndarray) -> Tuple[bool, str]:
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(img_rgb)

    if not results.multi_face_landmarks:
        return (False, "undetected")

    landmarks = results.multi_face_landmarks[0].landmark

    nose = landmarks[1]
    left_eye = landmarks[33]
    right_eye = landmarks[263]

    dx = right_eye.x - left_eye.x
    dy = right_eye.y - left_eye.y
    gaze_angle = np.arctan2(dy, dx)

    eye_contact = abs(gaze_angle) < 0.1

    direction = "center"
    if gaze_angle > 0.2:
        direction = "left"
    elif gaze_angle < -0.2:
        direction = "right"

    return (eye_contact, direction)
