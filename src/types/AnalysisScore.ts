export interface FaceAnalysisRaw {
  status: string;
  confidenceScore?: string;
  engagementScore?: string;
  eyeContactRatio?: string;
  cameraAvoidanceCount?: string;
  dominantEmotions?: string;
  framesProcessed?: string;
  framesWithFace?: string;
  framesWithEmotion?: string;
  processingTimeSec?: string;
  [key: string]: any;
}

// Normalize edilmiş, kullanılabilir hali:
export interface CleanFaceAnalysisScore {
  overallFaceScore: number; // 0-100
  details: {
    engagementScore: number;     // 0-100
    eyeContactScore: number;     // 0-100
    cameraAvoidanceScore: number;// 0-100 (az kaçınma = yüksek skor)
    emotionScore: number;        // 0-100
  };
  dominantEmotions: string[];
  isReliable: boolean;
  warnings: string[];
}


//Ses Analizi (Voice Analysis)
export interface VoiceAnalysisRaw {
  status: string;
  audio_path?: string;
  sampling_rate?: string;
  language?: string;
  provider?: string;
  speechRate?: string;
  energyMean?: string;
  energyStd?: string;
  energyMax?: string;
  energyMin?: string;
  pitchMean?: string;
  pitchStd?: string;
  pitchMin?: string;
  pitchMax?: string;
  voiceBreakRatio?: string;
  vadFrames?: string;
  nonVadFrames?: string;
  clippingRatio?: string;
  snrEstimate?: string;
  dominantEmotion?: string;
  emotionScores?: Record<string, number>;
  framesProcessed?: string;
  framesWithVoice?: string;
  processingTimeSec?: string;
  error?: string;
  prosody?: ProsodyAnalysisResult;
  [key: string]: any;
}

export interface ProsodyAnalysisResult {
  speechFluencyScore: number;
  voiceConfidenceScore: number;
  voiceEmotionLabel: string;
  speechRate: number;
  averagePause: number;
  totalPauses: number;
  pauseDurations: number[];
  totalDuration: number;
  validWords: number;
  avgWordDuration: number;
}

export interface CleanVoiceAnalysisScore {
  overallVoiceScore: number; // 0-100
  details: {
    fluencyScore: number;          // Prosody’den normalize edilen (0-100)
    emotionScore: number;          // dominant duygudan, (0-100)
    speechRateScore: number;       // aralık kontrolünden, (0-100)
    signalQualityScore: number;    // SNR ve energy/pitch, (0-100)
  };
  dominantEmotion: string;
  isReliable: boolean;
  warnings: string[];
}



// Soru-LLM Analizi (Soruya Verilen Yanıtın Değerlendirmesi)
export interface QuestionLLMAnalysisScore {
  answerRelevanceScore: number;   // Soruya uygunluk 0-100
  keywordCoverageScore: number;   // Anahtar kelime kapsama
  technicalScore: number;         // Teknik yeterlilik (varsa)
  clarityScore: number;           // Açıklık, anlatım netliği
  completenessScore: number;      // Cevabın bütünlüğü
  initiativeScore: number;        // Kendi katkısı, özgünlük, insiyatif
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  notes?: string;
  [key: string]: any;             // Genişletilebilirlik için
  overallLLMScore?: number;       // Otomatik olarak ağırlıklı hesaplanacak
  isReliable?: boolean;
  warnings?: string[];
}


//4. Genel Soru Değerlendirmesi / Final Score
// Kullanıcıdan alınacak ağırlıklar (toplam 1.0 olacak şekilde önerilir)
export interface ScoreWeights {
  face: number;   // örn: 0.2
  voice: number;  // örn: 0.2
  llm: number;    // örn: 0.6
}

// Her soru için final çıktı
export interface QuestionEvaluationResult {
  finalScore: number; // 0-100
  breakdown: {
    face: number;
    voice: number;
    llm: number;
  };
  faceScore: CleanFaceAnalysisScore;
  voiceScore: CleanVoiceAnalysisScore;
  llmScore: QuestionLLMAnalysisScore;
  isReliable: boolean;
  warnings: string[];
  llmCommentary?: LLMGeneralAssessment;
}

export interface LLMGeneralAssessment {
  overallAssessment: string;
  faceAnalysisSummary: string;
  voiceAnalysisSummary: string;
  llmAnalysisSummary: string;
  finalScore: number;
  breakdown: Record<string, number>;
  recommendation: string;
  improvementSuggestions: string[];
  reliability: boolean;
}


export interface VideoAnalysisPipelineJob {
  // ... diğer alanlar
  faceScores: FaceAnalysisRaw;
  voiceScores: VoiceAnalysisRaw;
  questionAIResult: QuestionLLMAnalysisScore;
  evaluationResult?: QuestionEvaluationResult;
  // ... diğer pipeline/metrik alanları
}
// Tipler
export interface QuestionAIResult {
  answerRelevanceScore: number;
  keywordCoverageScore?: number;
  technicalScore?: number;
  clarityScore?: number;
  completenessScore?: number;
  initiativeScore?: number;
  [key: string]: any;
}


