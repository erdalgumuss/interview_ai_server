export interface GPTAnalysisInput {
  // Soru temelli
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  complexityLevel: string;
  requiredSkills: string[];

  // Aday profili
  candidateSkills: string[];
  candidateExperience: string[];
  candidateEducation: string[];
  documents?: string[]; // Özgeçmiş, sertifika vs.

  // Kişilik & soft-skills
  personalityScores: Record<string, number>;
  personalityFit: number | null;

  // Ses ve konuşma
  transcript: string;
  voiceProsody?: {
    speechFluencyScore: number;
    speechRate: number;
    averagePause: number;
    totalPauses: number;
    avgWordDuration: number;
    voiceConfidenceScore?: number;
  };
  voiceEmotionScores?: Record<string, number>;
  dominantVoiceEmotion?: string;
  energyMean?: number;
  pitchMean?: number;
  pitchStd?: number;
  snrEstimate?: number;

  // Video/Face
  faceEmotionScores?: Record<string, number>;
  dominantFaceEmotion?: string;
  attentionScore?: number;
  eyeContactScore?: number;

  // Süre/teknik meta
  videoDuration?: number;
  audioDuration?: number;
  backgroundNoise?: number;

  // Diğer
  applicationStatus?: string;
  retryCount?: number;
  maxRetryAttempts?: number;
  supportRequests?: string[];
}
export interface GPTAnalysisOutput {
  answerRelevanceScore: number;           // 0-100
  answerCoverage: string;                 // Kapsanan ve eksik anahtar noktalar
  detectedKeywords: string[];             // Tespit edilen anahtar kelimeler
  strengths: string[];                    // Güçlü yönler
  weaknesses: string[];                   // Zayıf/gelişmeye açık alanlar
  softSkillsAssessment: {                 // Soft skill başlıkları ve puanları
    communication: number;
    leadership: number;
    teamwork: number;
    problemSolving: number;
    [key: string]: number;
  };
  technicalSkillsAssessment: {            // Teknik başlıklar ve puanlar
    [key: string]: number;
  };
  personalityAssessment?: {               // Kişilik skorları
    [key: string]: number;
  };
  voiceAnalysisSummary?: {                // Ses konuşma analizi özet
    speechFluency: number;
    speechRate: number;
    averagePause: number;
    emotionDetected: string;
    [key: string]: any;
  };
  faceAnalysisSummary?: {                 // Yüz analizi özet
    attention: number;
    dominantEmotion: string;
    [key: string]: any;
  };
  recommendation: string;
  overallScore: number;
  notes?: string;                         // Ekstra kısa not
}
