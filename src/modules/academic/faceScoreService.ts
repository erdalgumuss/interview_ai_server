import type { FaceAnalysisRaw, CleanFaceAnalysisScore } from '../../types/AnalysisScore.ts';

// Pozisyona veya kuruma göre dışarıdan yönetilebilecek şekilde bırak
export const FACE_SCORE_WEIGHTS = {
  engagementScore: 0.4,
  eyeContactScore: 0.3,
  cameraAvoidanceScore: 0.2,
  emotionScore: 0.1,
} as const;

export function calculateCleanFaceScore(
  faceScores: FaceAnalysisRaw
): CleanFaceAnalysisScore {
  const warnings: string[] = [];

  // Güvenli sayıya çevirici
  function safeParse(val?: string | number | null, fallback = 0): number {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'number') return val;
    const v = String(val).trim().toLowerCase();
    if (!v || v === 'none' || v === 'nan' || v === '-') return fallback;
    const parsed = Number(v);
    return isNaN(parsed) ? fallback : parsed;
  }

  // 1. Engagement (0-5)
  let engagementScore = safeParse(faceScores.engagementScore, 2.5);
  if (engagementScore < 0 || engagementScore > 5) {
    warnings.push('EngagementScore out of range.');
    engagementScore = 2.5;
  }
  const engagementNorm = engagementScore / 5;

  // 2. Eye Contact (0-1)
  let eyeContactRatio = safeParse(faceScores.eyeContactRatio, 0.5);
  if (eyeContactRatio < 0 || eyeContactRatio > 1) {
    warnings.push('EyeContactRatio out of range.');
    eyeContactRatio = 0.5;
  }

  // 3. Camera Avoidance (0-20) -> 0 = en iyi, 20 = en kötü
  let cameraAvoidanceCount = safeParse(faceScores.cameraAvoidanceCount, 10);
  if (cameraAvoidanceCount < 0 || cameraAvoidanceCount > 20) {
    warnings.push('CameraAvoidanceCount out of range.');
    cameraAvoidanceCount = 10;
  }
  const cameraAvoidanceScore = Math.max(0, 1 - cameraAvoidanceCount / 20);

  // 4. Dominant Emotions (her zaman array olacak şekilde)
  let dominantEmotions: string[] = [];
  let emotionScore = 0.7;
  try {
    const emoField = faceScores.dominantEmotions || '[]';
    if (emoField.trim().startsWith('[')) {
      dominantEmotions = JSON.parse(emoField.replace(/'/g, '"'));
    } else if (emoField) {
      dominantEmotions = [emoField.replace(/['"\[\]]/g, '')];
    }
    dominantEmotions = dominantEmotions.map((e) => e.toLowerCase());
    if (dominantEmotions.some((e) => e.includes('happy')))      emotionScore = 1;
    else if (dominantEmotions.some((e) => e.includes('neutral'))) emotionScore = 0.7;
    else if (dominantEmotions.some((e) => e.includes('sad') || e.includes('angry'))) emotionScore = 0.3;
    else emotionScore = 0.5;
  } catch {
    warnings.push('DominantEmotions parsing error.');
    dominantEmotions = ['neutral'];
    emotionScore = 0.7;
  }

  // 5. Reliability Check
  const framesProcessed = safeParse(faceScores.framesProcessed, 0);
  const framesWithFace  = safeParse(faceScores.framesWithFace, 0);
  let confidenceScore   = safeParse(faceScores.confidenceScore, 0.5);
  if (confidenceScore > 1.01) confidenceScore /= 100; // (0-100 den 0-1'e)

  const isReliable =
    faceScores.status === 'done' &&
    framesProcessed > 10 &&
    framesWithFace / Math.max(framesProcessed, 1) > 0.6 &&
    confidenceScore > 0.5;

  if (!isReliable) warnings.push('Face analysis reliability is low.');

  // 6. Weighted Calculation
  const weights = FACE_SCORE_WEIGHTS;
  const overallScoreRaw =
    engagementNorm * weights.engagementScore +
    eyeContactRatio * weights.eyeContactScore +
    cameraAvoidanceScore * weights.cameraAvoidanceScore +
    emotionScore * weights.emotionScore;

  return {
    overallFaceScore: Math.round(overallScoreRaw * 100),
    details: {
      engagementScore: Math.round(engagementNorm * 100),
      eyeContactScore: Math.round(eyeContactRatio * 100),
      cameraAvoidanceScore: Math.round(cameraAvoidanceScore * 100),
      emotionScore: Math.round(emotionScore * 100),
    },
    dominantEmotions,
    isReliable,
    warnings,
  };
}
