import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

def analyze_gaze(frame, gaze_threshold=0.1):
    try:
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(img_rgb)
        if not results.multi_face_landmarks:
            return (False, "undetected")
        landmarks = results.multi_face_landmarks[0].landmark
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        dx = right_eye.x - left_eye.x
        dy = right_eye.y - left_eye.y
        gaze_angle = np.arctan2(dy, dx)
        eye_contact = abs(gaze_angle) < gaze_threshold
        direction = "center"
        if gaze_angle > 0.2:
            direction = "left"
        elif gaze_angle < -0.2:
            direction = "right"
        return (eye_contact, direction)
    except Exception:
        return (False, "undetected")
