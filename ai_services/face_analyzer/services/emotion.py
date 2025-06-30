from deepface import DeepFace

def analyze_emotion(frame) -> str:
    try:
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        return result[0]['dominant_emotion']
    except Exception:
        return None
