import { CleanFaceAnalysisScore, CleanVoiceAnalysisScore, LLMAnalysisScore, ScoreWeights, FinalScoreResult } from './types.ts';

export function calculateFinalScore(
  face: CleanFaceAnalysisScore,
  voice: CleanVoiceAnalysisScore,
  llm: LLMAnalysisScore,
  weights: ScoreWeights
): FinalScoreResult {
  // Default ağırlıklar toplamı 1 olmalı (gerekirse normalize et)
  const total = weights.face + weights.voice + weights.llm;
  const norm = total === 0 ? 1 : total;

  // Detaylı puanlar
  const faceScore = face.overallFaceScore ?? 0;
  const voiceScore = voice.overallVoiceScore ?? 0;
  const llmScore = llm.overallLLMScore ?? 0;

  // Weighted toplam
  const weighted =
    (faceScore * weights.face + voiceScore * weights.voice + llmScore * weights.llm) / norm;

  // Reliability (herhangi biri güvenilmezse düşük)
  const isReliable = face.isReliable && voice.isReliable && llm.isReliable;

  const warnings = [
    ...(face.warnings || []),
    ...(voice.warnings || []),
    ...(llm.warnings || [])
  ];

  return {
    weightedScore: Math.round(weighted),
    weightedBreakdown: {
      face: Math.round(faceScore),
      voice: Math.round(voiceScore),
      llm: Math.round(llmScore)
    },
    isReliable,
    warnings
  };
}
