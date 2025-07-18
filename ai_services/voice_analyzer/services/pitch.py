import numpy as np
from utils.audio_utils import load_audio
from config.audio_config import FRAME_LENGTH, HOP_LENGTH

def extract_pitch(
    audio_path: str,
    frame_length: int = FRAME_LENGTH,
    hop_length: int = HOP_LENGTH,
    min_pitch_hz: float = 50.0,
    max_pitch_hz: float = 500.0,
    include_time_series: bool = False,
) -> dict:
    """
    Kapsamlı pitch (F0) analizi.
    - Ortalama pitch, std, min/max, voice break oranı
    - Zaman serisi (isteğe bağlı)
    """
    try:
        import librosa

        y, sr = load_audio(audio_path)
        pitches, magnitudes = librosa.piptrack(
            y=y, sr=sr, n_fft=frame_length, hop_length=hop_length,
            fmin=min_pitch_hz, fmax=max_pitch_hz
        )

        # Her frame için en yüksek enerjiye sahip pitch’i seç
        pitch_per_frame = pitches[magnitudes.argmax(axis=0), np.arange(magnitudes.shape[1])]
        # Threshold: 0 olanlar (voiceless frame) outlier, voice break olarak kabul
        valid_pitches = pitch_per_frame[pitch_per_frame > 0]

        if len(valid_pitches) == 0:
            return {
                "pitchMean": 0.0,
                "pitchStd": 0.0,
                "pitchMin": 0.0,
                "pitchMax": 0.0,
                "voiceBreakRatio": 1.0,
                "pitchTimeSeries": [],
                "error": "No pitch detected"
            }

        voice_break_ratio = float(np.sum(pitch_per_frame == 0) / len(pitch_per_frame))

        # Opsiyonel: Zaman serisi (ilk 50 frame)
        times = librosa.frames_to_time(np.arange(len(pitch_per_frame)), sr=sr, hop_length=hop_length, n_fft=frame_length)
        pitch_time_series = (
            [
                {"time": round(float(t), 2), "pitch": round(float(p), 2)}
                for t, p in zip(times, pitch_per_frame)
            ][:50] if include_time_series else []
        )

        return {
            "pitchMean": round(float(np.mean(valid_pitches)), 2),
            "pitchStd": round(float(np.std(valid_pitches)), 2),
            "pitchMin": round(float(np.min(valid_pitches)), 2),
            "pitchMax": round(float(np.max(valid_pitches)), 2),
            "voiceBreakRatio": round(voice_break_ratio, 3),
            "pitchTimeSeries": pitch_time_series,
            "error": None
        }

    except Exception as e:
        return {
            "pitchMean": 0.0,
            "pitchStd": 0.0,
            "pitchMin": 0.0,
            "pitchMax": 0.0,
            "voiceBreakRatio": 1.0,
            "pitchTimeSeries": [],
            "error": str(e)
        }
