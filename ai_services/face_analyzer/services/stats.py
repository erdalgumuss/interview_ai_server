def calculate_confidence_score(eye_contact_ratio, avoidances, dominant_emotions):
    # Basit örnek skor fonksiyonu
    base = eye_contact_ratio * 60 - avoidances * 5
    if "happy" in dominant_emotions:
        base += 10
    return round(max(base, 0), 2)

def calculate_engagement_score(eye_contact_ratio, dominant_emotions):
    score = eye_contact_ratio * 70
    if "surprised" in dominant_emotions:
        score += 5
    return round(max(score, 0), 2)
