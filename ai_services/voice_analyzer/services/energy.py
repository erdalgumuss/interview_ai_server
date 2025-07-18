import numpy as np
from utils.audio_utils import load_audio
from config.audio_config import VAD_THRESHOLD, FRAME_LENGTH, HOP_LENGTH

def extract_energy(
    audio_path: str,
    frame_length: int = FRAME_LENGTH,
    hop_length: int = HOP_LENGTH,
    vad_threshold: float = VAD_THRESHOLD,
    include_time_series: bool = False,
) -> dict:
    try:
        y, sr = load_audio(audio_path)
        import librosa

        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
        times = librosa.frames_to_time(np.arange(rms.size), sr=sr, hop_length=hop_length, n_fft=frame_length)
        db_energy = librosa.amplitude_to_db(rms, ref=np.max)

        vad_mask = rms > vad_threshold
        speech_ratio = float(np.mean(vad_mask))

        energy_mean = float(np.mean(rms))
        energy_std = float(np.std(rms))
        energy_max = float(np.max(rms))
        energy_min = float(np.min(rms))
        db_mean = float(np.mean(db_energy))
        db_std = float(np.std(db_energy))
        dynamic_range = float(energy_max - energy_min)

        clipping_ratio = float(np.sum(np.abs(y) > 0.99) / y.size)
        speech_rms = rms[vad_mask] if vad_mask.any() else np.array([0.0])
        noise_rms = rms[~vad_mask] if (~vad_mask).any() else np.array([1e-9])
        snr_estimate = float(
            10 * np.log10(np.mean(speech_rms) / (np.mean(noise_rms) + 1e-9))
        )

        energy_time_series = (
            [
                {"time": round(float(t), 2), "rms": round(float(r), 4), "vad": int(v)}
                for t, r, v in zip(times, rms, vad_mask)
            ][:50]
            if include_time_series
            else []
        )

        return {
            "energyMean": round(energy_mean, 4),
            "energyStd": round(energy_std, 4),
            "energyMax": round(energy_max, 4),
            "energyMin": round(energy_min, 4),
            "energyDBMean": round(db_mean, 2),
            "energyDBStd": round(db_std, 2),
            "dynamicRange": round(dynamic_range, 4),
            "speechRatio": round(speech_ratio, 4),
            "vadFrames": int(np.sum(vad_mask)),
            "nonVadFrames": int(np.sum(~vad_mask)),
            "clippingRatio": round(clipping_ratio, 4),
            "snrEstimate": round(snr_estimate, 2),
            "energyTimeSeries": energy_time_series,
            "error": None,
        }

    except Exception as e:
        return {
            "energyMean": 0.0,
            "energyStd": 0.0,
            "energyMax": 0.0,
            "energyMin": 0.0,
            "energyDBMean": 0.0,
            "energyDBStd": 0.0,
            "dynamicRange": 0.0,
            "speechRatio": 0.0,
            "vadFrames": 0,
            "nonVadFrames": 0,
            "clippingRatio": 0.0,
            "snrEstimate": None,
            "energyTimeSeries": [],
            "error": str(e),
        }
