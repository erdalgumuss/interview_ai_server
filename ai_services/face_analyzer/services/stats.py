def calculate_confidence_score(eye_contact_ratio, avoidances, dominant_emotions):
    """
    Basit güven (confidence) puanı:
    - Göz teması yüksekse puan artar.
    - Kameradan kaçış sayısı (avoidance) puanı azaltır.
    - 'Happy' duygu tespit edilirse bonus puan eklenir.
    """
    base = eye_contact_ratio * 60 - avoidances * 5
    if "happy" in dominant_emotions:
        base += 10
    # Skor asla negatif olmasın, ondalık hassasiyetli döndür
    return round(max(base, 0), 2)

def calculate_engagement_score(eye_contact_ratio, dominant_emotions):
    """
    Basit katılım (engagement) puanı:
    - Göz teması yüksekse artar.
    - 'Surprised' duygu tespit edilirse küçük bir bonus eklenir.
    """
    score = eye_contact_ratio * 70
    if "surprised" in dominant_emotions:
        score += 5
    return round(max(score, 0), 2)
