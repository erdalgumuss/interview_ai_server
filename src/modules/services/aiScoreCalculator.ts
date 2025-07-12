export const calculateFinalScores = ({
    gptScore, confidenceScore, voiceConfidenceScore, speechFluencyScore,
}: {
    gptScore: number;
    confidenceScore: number;
    voiceConfidenceScore: number;
    speechFluencyScore: number;
}, rest: any): {
  communicationScore: number;
  overallScore: number;
} => {
  const weights = {
    face: 0.4,
    voice: 0.4,
    fluency: 0.2,
    gpt: 0.6,
    communication: 0.4,
  };

  const safe = (value: number): number => isNaN(value) ? 0 : value;

  const communicationComponents = [
    { score: safe(confidenceScore), weight: weights.face },
    { score: safe(voiceConfidenceScore), weight: weights.voice },
    { score: safe(speechFluencyScore), weight: weights.fluency },
  ];

  const totalCommWeight = communicationComponents.reduce((sum, c) => sum + c.weight, 0);

  const communicationScore = Math.round(
    communicationComponents.reduce((sum, c) => sum + c.score * c.weight, 0) / totalCommWeight
  );

  const overallScore = Math.round(
    safe(gptScore) * weights.gpt + communicationScore * weights.communication
  );

  return {
    communicationScore,
    overallScore,
  };
};
