import type {
  CleanFaceAnalysisScore,
  CleanVoiceAnalysisScore,
  QuestionLLMAnalysisScore,
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

// LLM Score (overall) için otomatik ağırlık hesabı
function calcOverallLLMScore(llm: QuestionLLMAnalysisScore): number {
  // Varsayılan ağırlıklar (dışarıdan alabilir, pozisyona göre esnetilebilir)
  const defaultWeights = {
    answerRelevanceScore: 0.35,
    keywordCoverageScore: 0.15,
    technicalScore: 0.15,
    clarityScore: 0.15,
    completenessScore: 0.10,
    initiativeScore: 0.10,
  };
  // Her parametre varsa katkı sağlar
  let sum = 0;
  let used = 0;
  Object.entries(defaultWeights).forEach(([key, w]) => {
    const v = typeof llm[key] === 'number' ? llm[key] : null;
    if (v !== null && v !== undefined) {
      sum += (v as number) * w;
      used += w;
    }
  });
  // Kullanılan ağırlık toplamı <1 olabilir (bazı parametreler yoksa), normalleştir
  return used > 0 ? Math.round(sum / used) : 0;
}

/**
 * Final soru değerlendirme skorunu hesaplar ve tüm detayları breakdown ile döner.
 */
export function calculateQuestionEvaluationResult(
  faceScore: CleanFaceAnalysisScore,
  voiceScore: CleanVoiceAnalysisScore,
  llmScore: QuestionLLMAnalysisScore,
  weights: ScoreWeights,
  llmCommentary?: LLMGeneralAssessment // opsiyonel, GPT ile ekstra yorum
): QuestionEvaluationResult {
  // 1. LLM genel skoru varsa al, yoksa otomatik hesapla
  const llmOverall = typeof llmScore.overallLLMScore === 'number'
    ? llmScore.overallLLMScore
    : calcOverallLLMScore(llmScore);

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
    llmScore: { ...llmScore, overallLLMScore: llmOverall },
    isReliable,
    warnings,
    llmCommentary,
  };
}
