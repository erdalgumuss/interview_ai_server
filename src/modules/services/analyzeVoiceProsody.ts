import { fluencyConfig } from '../config/voiceAnalysisConfig.ts';

type WordData = { word: string; start: number; end: number; confidence: number };

export const analyzeVoiceProsody = async (
  audioPath: string,
  words: WordData[] = []
) => {
  if (!Array.isArray(words) || words.length < 2) {
    console.warn('📉 Insufficient word data for prosody analysis.');
    return defaultVoiceAnalysis();
  }

  const totalDuration = words[words.length - 1].end - words[0].start;
  const speechRate = words.length / totalDuration;

  const pauses = [];
  for (let i = 1; i < words.length; i++) {
    const pause = words[i].start - words[i - 1].end;
    if (pause > 0.3) pauses.push(pause);
  }

  const avgPause = pauses.length > 0
    ? pauses.reduce((a, b) => a + b, 0) / pauses.length
    : 0;

  const validConfidences = words
    .map((w) => w.confidence)
    .filter((c) => typeof c === 'number' && !isNaN(c));

  const avgConfidence = validConfidences.length > 0
    ? validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length
    : 0;

  const rawFluency = (speechRate - 1.2) * 40 - avgPause * 30 + 70;
  const speechFluencyScore = isNaN(rawFluency) ? 0 : Math.round(Math.max(0, Math.min(100, rawFluency)));

  const voiceConfidenceScoreRaw = avgConfidence * 100;
  const voiceConfidenceScore = isNaN(voiceConfidenceScoreRaw)
    ? 0
    : Math.round(voiceConfidenceScoreRaw);

  const voiceEmotionLabel = determineEmotion(avgPause, avgConfidence);

  return {
    speechFluencyScore,
    voiceConfidenceScore,
    voiceEmotionLabel,
    speechRate: Number.isFinite(speechRate) ? Number(speechRate.toFixed(2)) : 0,
    averagePause: Number.isFinite(avgPause) ? Number(avgPause.toFixed(2)) : 0,
    totalPauses: pauses.length,
  };
};

function determineEmotion(pause: number, confidence: number): string {
  if (pause > 1.0) return 'Hesitant';
  if (confidence > 0.9) return 'Confident';
  if (pause > 0.6) return 'Deliberate';
  if (confidence < 0.5) return 'Uncertain';
  return 'Calm';
  
}

function defaultVoiceAnalysis() {
  return {
    speechFluencyScore: 50,
    voiceConfidenceScore: 50,
    voiceEmotionLabel: 'Neutral',
    speechRate: 0,
    averagePause: 0,
    totalPauses: 0
  };
}
