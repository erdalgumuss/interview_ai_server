type WordData = { word: string; start: number; end: number; confidence: number };

export const analyzeVoiceProsody = async (
  audioPath: string,
  words: WordData[] = []
): Promise<{
  speechFluencyScore: number;
  voiceConfidenceScore: number;
  voiceEmotionLabel: string;
  speechRate: number;
  averagePause: number;
  totalPauses: number;
}> => {
  if (words.length < 2) {
    console.warn('Insufficient word data for prosody analysis.');
    return {
      speechFluencyScore: 50,
      voiceConfidenceScore: 50,
      voiceEmotionLabel: 'Neutral',
      speechRate: 0,
      averagePause: 0,
      totalPauses: 0
    };
  }

  const totalDuration = words[words.length - 1].end - words[0].start;
  const speechRate = words.length / totalDuration;

  const pauses: number[] = [];
  for (let i = 1; i < words.length; i++) {
    const pause = words[i].start - words[i - 1].end;
    if (pause > 0.3) pauses.push(pause); // 300ms üstü duraklamaları al
  }
  const avgPause = pauses.length > 0 ? pauses.reduce((a, b) => a + b) / pauses.length : 0;

  const avgConfidence =
    words.reduce((sum, w) => sum + w.confidence, 0) / words.length;

  const speechFluencyScore = Math.max(
    0,
    Math.min(100, (speechRate - 1.2) * 40 - avgPause * 30 + 70)
  );

  const voiceConfidenceScore = Math.round(avgConfidence * 100);

  const voiceEmotionLabel =
    avgPause > 0.8 ? 'Hesitant' : avgConfidence > 0.85 ? 'Confident' : 'Calm';

  return {
    speechFluencyScore: Math.round(speechFluencyScore),
    voiceConfidenceScore,
    voiceEmotionLabel,
    speechRate: Number(speechRate.toFixed(2)),
    averagePause: Number(avgPause.toFixed(2)),
    totalPauses: pauses.length,
  };
};
