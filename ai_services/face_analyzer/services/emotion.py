from deepface import DeepFace

def analyze_emotion(frame) -> str:
    """
    Tek bir görüntü/frame için dominant duyguyu döndürür.
    None dönerse, yüzde tespit edilememiş ya da model hata vermiştir.
    """
    try:
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        # DeepFace >= 2023 versiyonlarında result[0]['dominant_emotion'] yerine result['dominant_emotion'] olabilir!
        if isinstance(result, list):  # Bazı DeepFace sürümleri list, bazıları dict döner!
            dominant = result[0].get('dominant_emotion')
        else:
            dominant = result.get('dominant_emotion')
        return dominant
    except Exception as e:
        # İleride debug için log: print(f"[DeepFace] analyze_emotion hata: {e}")
        return None
