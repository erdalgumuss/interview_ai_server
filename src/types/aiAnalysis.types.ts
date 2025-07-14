export interface GPTResult {
    answerRelevanceScore: number;
    skillFitScore: number;
    backgroundFitScore: number;
    keywordMatches: string[];
    strengths: string[];
    improvementAreas: string[];
    recommendation: string;
}

export interface FaceResult {
    engagementScore: number;
    confidenceScore: number;
    emotionLabel: string;
}

export interface VoiceResult {
    speechFluencyScore: number;
    voiceConfidenceScore: number;
    voiceEmotionLabel: string;
    speechRate: number;
    averagePause: number;
    totalPauses: number;
}

export interface AnalyzeInput {
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  complexityLevel: string;
  requiredSkills: string[];
  candidateSkills: string[];
  candidateExperience: string[];
  candidateEducation: string[];
  personalityScores: Record<string, number>;
  personalityFit?: number | null;
  transcript: string;
}
