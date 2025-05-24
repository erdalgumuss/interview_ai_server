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
  console.log('🎤 Voice prosody analysis started for audio:', audioPath);
  console.log('🕒 Word count:', words.length);

  let speechRate = 0;
  let averagePause = 0;
  let totalPauses = 0;
  let avgConfidence = 0;

  if (words.length >= 2) {
    const duration = words[words.length - 1].end - words[0].start;
    speechRate = words.length / duration;

    const pauses: number[] = [];
    for (let i = 1; i < words.length; i++) {
      const pause = words[i].start - words[i - 1].end;
      if (pause > 0.3) pauses.push(pause);
    }

    totalPauses = pauses.length;
    averagePause = pauses.length > 0
      ? pauses.reduce((a, b) => a + b, 0) / pauses.length
      : 0;

    const validConfidences = words
      .map(w => w.confidence)
      .filter(c => typeof c === 'number' && !isNaN(c));

    avgConfidence = validConfidences.length > 0
      ? validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length
      : 0;
  }

  const voiceConfidenceScore = Math.round(avgConfidence * 100);
  const voiceEmotionLabel = 'Calm';

  const speechFluencyScore = Math.max(
    0,
    100 - (averagePause * 50 + totalPauses * 5)
  );

  return {
    speechFluencyScore: Math.round(speechFluencyScore),
    voiceConfidenceScore: isNaN(voiceConfidenceScore) ? 0 : voiceConfidenceScore,
    voiceEmotionLabel,
    speechRate: Number.isFinite(speechRate) ? Number(speechRate.toFixed(2)) : 0,
    averagePause: Number.isFinite(averagePause) ? Number(averagePause.toFixed(2)) : 0,
    totalPauses,
  };
};
