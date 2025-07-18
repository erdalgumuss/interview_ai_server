import librosa

def load_audio(audio_path: str):
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    if y.size == 0:
        raise ValueError("Audio dosyası boş veya okunamıyor!")
    return y, sr
