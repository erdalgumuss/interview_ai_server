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
