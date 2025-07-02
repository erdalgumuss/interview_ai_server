def calculate_confidence_score(eye_ratio: float, avoid_count: int, emotions: list) -> int:
    avoid_penalty = min(avoid_count, 5) / 5
    fear_present = any(e in ['fear', 'angry'] for e in emotions)

    score = (
        eye_ratio * 60 +
        (1 - avoid_penalty) * 30 +
        (0 if fear_present else 10)
    )
    return round(min(score, 100))


def calculate_engagement_score(eye_ratio: float, emotions: list) -> int:
    positive = ['happy', 'surprised', 'neutral']
    negative = ['sad', 'fear', 'disgust']

    pos_count = len([e for e in emotions if e in positive])
    neg_count = len([e for e in emotions if e in negative])

    score = eye_ratio * 50 + pos_count * 10 - neg_count * 5
    return round(max(0, min(score, 100)))
