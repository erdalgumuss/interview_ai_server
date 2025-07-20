import type {
  CleanFaceAnalysisScore,
  CleanVoiceAnalysisScore,
    CleanLLMScore,
  ScoreWeights,
  QuestionEvaluationResult,
  LLMGeneralAssessment
} from '../../types/AnalysisScore'; 

// Ağırlıkları normalize et (toplamı 1 olacak şekilde)
function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const sum = (weights.face || 0) + (weights.voice || 0) + (weights.llm || 0) || 1;
  return {
    face: (weights.face || 0) / sum,
    voice: (weights.voice || 0) / sum,
    llm: (weights.llm || 0) / sum,
  };
}



/**
 * Final soru değerlendirme skorunu hesaplar ve tüm detayları breakdown ile döner.
 */
export function calculateQuestionEvaluationResult(
  faceScore: CleanFaceAnalysisScore,
  voiceScore: CleanVoiceAnalysisScore,
  llmScore: CleanLLMScore,
  weights: ScoreWeights,
  llmCommentary?: LLMGeneralAssessment // opsiyonel, GPT ile ekstra yorum
): QuestionEvaluationResult {
  // 1. LLM genel skoru varsa al, yoksa otomatik hesapla
  const llmOverall = typeof llmScore.overallLLMScore === 'number'
    ? llmScore.overallLLMScore
    : 0;

  // 2. Normalize ağırlıklar
  const normWeights = normalizeWeights(weights);

  // 3. Güvenilirlik & uyarılar
  const isReliable =
    faceScore.isReliable &&
    voiceScore.isReliable &&
    llmOverall > 10; // LLM <10 ise dikkate alma

  const warnings: string[] = [
    ...(faceScore.warnings || []),
    ...(voiceScore.warnings || []),
    ...(llmScore.warnings || []),
  ];
  if (!isReliable) warnings.push('Analysis reliability is low.');

  // 4. Final toplam skor
  const finalScore =
    faceScore.overallFaceScore * normWeights.face +
    voiceScore.overallVoiceScore * normWeights.voice +
    llmOverall * normWeights.llm;

  return {
    finalScore: Math.round(finalScore),
    breakdown: {
      face: Math.round(faceScore.overallFaceScore),
      voice: Math.round(voiceScore.overallVoiceScore),
      llm: Math.round(llmOverall),
    },
    faceScore,
    voiceScore,
    llmScore,
    isReliable,
    warnings,
    llmCommentary,
  };
}
