export type WordData = { word: string; start: number; end: number; confidence: number };

export interface VoiceProsodyResult {
  speechFluencyScore: number;
  voiceConfidenceScore: number;
  voiceEmotionLabel: string;
  speechRate: number;
  averagePause: number;
  totalPauses: number;
  pauseDurations: number[];    // Ek: Tüm duraklama arrayi (analiz ve görselleştirme için)
  totalDuration: number;       // Ek: Gerçek konuşma süresi
  validWords: number;          // Ek: Kaç kelime gerçekten analiz edildi
  avgWordDuration: number;     // Ek: Ortalama kelime süresi
}

export const analyzeVoiceProsody = async (
  words: WordData[] = []
): Promise<VoiceProsodyResult> => {
  console.log('🎤 Voice prosody analysis started for audio:');
  console.log('🕒 Word count:', words.length);

  let speechRate = 0;
  let averagePause = 0;
  let totalPauses = 0;
  let avgConfidence = 0;
  let totalDuration = 0;
  let avgWordDuration = 0;
  let pauseDurations: number[] = [];
  const validWords = words.length;

  if (words.length >= 2) {
    // Gerçek konuşma süresi (ilk kelime start ile son kelime end arası)
    totalDuration = words[words.length - 1].end - words[0].start;
    speechRate = words.length / totalDuration;

    // Duraklamaları hesapla
    for (let i = 1; i < words.length; i++) {
      const pause = words[i].start - words[i - 1].end;
      if (pause > 0.3) pauseDurations.push(pause);
    }
    totalPauses = pauseDurations.length;
    averagePause = pauseDurations.length > 0
      ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length
      : 0;

    // Ortalama kelime süresi (kelime end-start)
    avgWordDuration = words
      .map(w => w.end - w.start)
      .reduce((sum, d) => sum + d, 0) / words.length;

    // Ortalama confidence
    const validConfidences = words
      .map(w => w.confidence)
      .filter(c => typeof c === 'number' && !isNaN(c));

    avgConfidence = validConfidences.length > 0
      ? validConfidences.reduce((sum, c) => sum + c, 0) / validConfidences.length
      : 0;
  }

  const voiceConfidenceScore = Math.round(avgConfidence * 100);
  const voiceEmotionLabel = 'Calm'; // Baseline, ilerde modelden üretilebilir

  // Skorları daha hassaslaştır: Duraklama + speech rate + kelime süresiyle normalize et
  const fluencyPenalty = (averagePause * 50) + (totalPauses * 5);
  const speechFluencyScore = Math.max(
    0,
    100 - fluencyPenalty
  );

  return {
    speechFluencyScore: Math.round(speechFluencyScore),
    voiceConfidenceScore: isNaN(voiceConfidenceScore) ? 0 : voiceConfidenceScore,
    voiceEmotionLabel,
    speechRate: Number.isFinite(speechRate) ? Number(speechRate.toFixed(2)) : 0,
    averagePause: Number.isFinite(averagePause) ? Number(averagePause.toFixed(2)) : 0,
    totalPauses,
    pauseDurations,
    totalDuration: Number.isFinite(totalDuration) ? Number(totalDuration.toFixed(2)) : 0,
    validWords,
    avgWordDuration: Number.isFinite(avgWordDuration) ? Number(avgWordDuration.toFixed(2)) : 0,
  };
};
