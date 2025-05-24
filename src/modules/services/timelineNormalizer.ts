type Word = {
  word: string;
  start: number;
  end: number;
};

type FaceFrame = {
  time: number;
  emotion: string;
  confidence: number;
  engagement: number;
};

type EmotionDistribution = Record<string, number>;

type EnrichedWord = Word & {
  emotionDistribution: EmotionDistribution;
  dominantEmotion: string;
  emotionEntropy: number;
  avgConfidence: number;
  avgEngagement: number;
  matchedFrameCount: number;
  confidenceDrop: boolean;
  entropySpike: boolean;
  highlightForReview: boolean;
};

/** Entropy hesaplayıcı */
function calculateEntropy(distribution: EmotionDistribution): number {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  return Object.values(distribution).reduce((entropy, count) => {
    const p = count / total;
    return entropy - p * Math.log2(p);
  }, 0);
}

/** normalizeTimeline — kelimeleri yüz mimikleriyle eşleştirip zenginleştirir */
export function normalizeTimeline(words: Word[], faceFrames: FaceFrame[]): EnrichedWord[] {
  const confidenceThreshold = 0.5;
  const entropyThreshold = 1.2;

  return words.map((word) => {
    const duration = word.end - word.start;
    const timeMargin = Math.max(0.15, duration * 0.3);

    const start = word.start - timeMargin;
    const end = word.end + timeMargin;

    const relevantFrames = faceFrames.filter(
      (frame) => frame.time >= start && frame.time <= end
    );

    if (relevantFrames.length === 0) {
      return {
        ...word,
        emotionDistribution: {},
        dominantEmotion: '',
        emotionEntropy: 0,
        avgConfidence: 0,
        avgEngagement: 0,
        matchedFrameCount: 0,
        confidenceDrop: true,
        entropySpike: false,
        highlightForReview: true,
      };
    }

    const emotionDistribution: EmotionDistribution = {};
    let totalConfidence = 0;
    let totalEngagement = 0;

    for (const frame of relevantFrames) {
      emotionDistribution[frame.emotion] = (emotionDistribution[frame.emotion] || 0) + 1;
      totalConfidence += frame.confidence;
      totalEngagement += frame.engagement;
    }

    const entropy = calculateEntropy(emotionDistribution);
    const avgConfidence = totalConfidence / relevantFrames.length;
    const avgEngagement = totalEngagement / relevantFrames.length;

    const dominantEmotion = Object.entries(emotionDistribution).reduce(
      (a, b) => (b[1] > a[1] ? b : a),
      ['', 0]
    )[0];

    const confidenceDrop = avgConfidence < confidenceThreshold;
    const entropySpike = entropy > entropyThreshold;

    const highlightForReview = confidenceDrop || entropySpike || dominantEmotion === 'confused';

    return {
      ...word,
      emotionDistribution,
      dominantEmotion,
      emotionEntropy: parseFloat(entropy.toFixed(3)),
      avgConfidence: parseFloat(avgConfidence.toFixed(3)),
      avgEngagement: parseFloat(avgEngagement.toFixed(3)),
      matchedFrameCount: relevantFrames.length,
      confidenceDrop,
      entropySpike,
      highlightForReview,
    };
  });
}
