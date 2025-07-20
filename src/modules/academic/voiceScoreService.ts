import type { VoiceAnalysisRaw, CleanVoiceAnalysisScore } from '../../types/AnalysisScore.ts';

// (Kurum veya pozisyon başına override edilebilir.)
export const VOICE_SCORE_WEIGHTS = {
  fluencyScore: 0.4,
  emotionScore: 0.2,
  speechRateScore: 0.2,
  signalQualityScore: 0.2,
} as const;

export function calculateCleanVoiceScore(
  voiceScores: VoiceAnalysisRaw,
  weights: typeof VOICE_SCORE_WEIGHTS = VOICE_SCORE_WEIGHTS
): CleanVoiceAnalysisScore {
  const warnings: string[] = [];

  function safeParse(val?: string | number | null, fallback = 0): number {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'number') return val;
    const v = String(val).trim().toLowerCase();
    if (!v || v === 'none' || v === 'nan' || v === '-') return fallback;
    const parsed = Number(v);
    return isNaN(parsed) ? fallback : parsed;
  }

  // 1. Fluency (Prosody skoru, 0-100)
  let fluencyScore = safeParse(voiceScores.prosody?.speechFluencyScore, 50);
  if (fluencyScore < 0 || fluencyScore > 100) {
    warnings.push('FluencyScore out of range');
    fluencyScore = 50;
  }
  const fluencyNorm = fluencyScore / 100;

  // 2. Emotion Score (happy > neutral > other)
  let dominantEmotion = (voiceScores.dominantEmotion || '').toLowerCase();
  let emotionScore = 0.7;
  if (voiceScores.emotionScores && typeof voiceScores.emotionScores === 'object') {
    // En yüksek oranlı duyguyu bul ve ağırlık ver
    const emotions = Object.entries(voiceScores.emotionScores)
      .filter(([_, v]) => typeof v === 'number')
      .sort((a, b) => b[1] - a[1]);
    if (emotions.length > 0) {
      dominantEmotion = emotions[0][0];
      if (dominantEmotion === 'happy') emotionScore = 1;
      else if (dominantEmotion === 'neutral') emotionScore = 0.7;
      else if (['sad', 'angry'].includes(dominantEmotion)) emotionScore = 0.3;
      else emotionScore = 0.5;
    }
  }

  // 3. Speech Rate (1.5 - 3 kelime/sn ideal)
  let speechRate = safeParse(voiceScores.prosody?.speechRate, 2.2);
  let speechRateScore = 1;
  if (speechRate < 1.2) {
    speechRateScore = 0.4; // çok yavaş
    warnings.push('SpeechRate too slow');
  } else if (speechRate > 3.5) {
    speechRateScore = 0.5; // çok hızlı
    warnings.push('SpeechRate too fast');
  } else if (speechRate > 2.7) {
    speechRateScore = 0.85;
  } else if (speechRate < 1.5) {
    speechRateScore = 0.7;
  } else {
    speechRateScore = 1;
  }

  // 4. Signal Quality (SNR, pitch, energy)
  let snr = safeParse(voiceScores.snrEstimate, 10);
  let pitchStd = safeParse(voiceScores.pitchStd, 50);
  let energyMean = safeParse(voiceScores.energyMean, 0.06);

  let signalQualityScore = snr > 10 ? 1 : snr > 7 ? 0.8 : snr > 5 ? 0.6 : 0.3;
  if (snr < 5) warnings.push('Low SNR (voice may be noisy)');

  if (pitchStd < 30) {
    signalQualityScore *= 0.8;
    warnings.push('Pitch variation low (voice may be monotone)');
  }
  if (energyMean < 0.03) {
    signalQualityScore *= 0.8;
    warnings.push('Energy mean low (may be too quiet)');
  }

  // Reliability Check
  const isReliable =
    voiceScores.status === 'done' &&
    snr > 5 &&
    speechRateScore > 0.5 &&
    fluencyScore > 20;

  if (!isReliable) warnings.push('Voice analysis reliability is low');

  // Final ağırlıklı puan
  const overallScoreRaw =
    fluencyNorm * weights.fluencyScore +
    emotionScore * weights.emotionScore +
    speechRateScore * weights.speechRateScore +
    signalQualityScore * weights.signalQualityScore;

  return {
    overallVoiceScore: Math.round(overallScoreRaw * 100),
    details: {
      fluencyScore: Math.round(fluencyNorm * 100),
      emotionScore: Math.round(emotionScore * 100),
      speechRateScore: Math.round(speechRateScore * 100),
      signalQualityScore: Math.round(signalQualityScore * 100),
    },
    dominantEmotion,
    isReliable,
    warnings,
  };
}
