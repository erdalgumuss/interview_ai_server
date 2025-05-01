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
  let voiceConfidenceScore = 0;

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

    voiceConfidenceScore = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
  }

  // Mock duygu (ileride analiz yapılacak)
  const voiceEmotionLabel = 'Calm';

  // Fluency score: daha çok duraklama varsa düşer
  const speechFluencyScore = Math.max(
    0,
    100 - (averagePause * 50 + totalPauses * 5)
  );

  return {
    speechFluencyScore: Math.round(speechFluencyScore),
    voiceConfidenceScore: Math.round(voiceConfidenceScore * 100),
    voiceEmotionLabel,
    speechRate: Number(speechRate.toFixed(2)),
    averagePause: Number(averagePause.toFixed(2)),
    totalPauses,
  };
};
