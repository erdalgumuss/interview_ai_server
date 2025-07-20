import { QuestionAIResult } from "../../types/AnalysisScore";

// Ağırlıklar (pozisyona göre güncellenebilir)
export const LLM_SCORE_WEIGHTS = {
  answerRelevanceScore: 0.30,
  keywordCoverageScore: 0.15,
  technicalScore: 0.20,
  clarityScore: 0.10,
  completenessScore: 0.15,
  initiativeScore: 0.10
} as const;


export function calculateCleanLLMScore(
  result: QuestionAIResult,
  weights: typeof LLM_SCORE_WEIGHTS = LLM_SCORE_WEIGHTS
): { overallLLMScore: number; details: Record<string, number>; warnings: string[] } {
  const warnings: string[] = [];
  let totalScore = 0;
  let totalWeight = 0;
  const detailScores: Record<string, number> = {};

  function clamp(val: number, min = 0, max = 100): number {
    if (isNaN(val)) return min;
    return Math.max(min, Math.min(max, val));
  }

  // Her parametreyi ayrı ayrı normalize et, toplam ağırlıkla çarp
  for (const [key, weight] of Object.entries(weights)) {
    let raw = result[key as keyof QuestionAIResult];
    if (typeof raw !== 'number') {
      warnings.push(`${key} eksik, 0 puan olarak alındı.`);
      raw = 0;
    }
    const normalized = clamp(raw, 0, 100) / 100; // 0-1 aralığına çek
    totalScore += normalized * weight;
    totalWeight += weight;
    detailScores[key] = Math.round(normalized * 100);
  }

  // Toplam ağırlık 1'den azsa normalize et (ağırlık kaybı olmasın)
  if (totalWeight === 0) totalWeight = 1;
  const overallLLMScore = Math.round((totalScore / totalWeight) * 100);

  return {
    overallLLMScore,
    details: detailScores,
    warnings
  };
}
