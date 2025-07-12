export type PipelineStepState = 'pending' | 'in_progress' | 'done' | 'error';

export interface PipelineStep {
  state: PipelineStepState;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  details?: any;   // O adımın spesifik çıktısı (örn. faceScores, videoPath, vs.)
}

export interface VideoAnalysisPipelineJob {
  // Meta ve iş takibi
  meta: {
    apiVersion: string;
    requestId: string;
    callbackUrl?: string;
    timestamp: string;
  };

  // Başvuran ve aday bilgisi
  application: {
    id: string;
    candidate: {
      name: string;
      surname: string;
      email: string;
      education?: Array<{ school: string; degree: string; graduationYear: number }>;
      experience?: Array<{ company: string; position: string; duration: string }>;
      skills?: {
        technical?: string[];
        personal?: string[];
        languages?: string[];
      };
      [key: string]: any;
    };
    [key: string]: any;
  };

  // Soru, video ve mülakat bilgisi
  interviewId: string;
  interviewTitle?: string;
  questionId: string;
  order: number;
  duration: number;
  videoResponseId: string;
  videoUrl: string;

  // AI analiz inputları ve pipeline steps
  questionText: string;
  expectedAnswer: string;
  keywords: string[];
  aiMetadata?: {
    complexityLevel?: string;
    requiredSkills?: string[];
    [key: string]: any;
  };

  pipelineSteps: {
    video_downloaded: PipelineStep;
    audio_extracted:  PipelineStep;
    transcribed:      PipelineStep;
    face_analyzed:    PipelineStep;
    voice_analyzed:   PipelineStep;
    gpt_analyzed:     PipelineStep;
    final_scored:     PipelineStep;
    results_saved:    PipelineStep;
    input_normalized: PipelineStep; // Yeni adım: Normalizasyon
    // Gelecekte yeni adımlar da buraya eklenebilir
  };

  // Genel pipeline durumu ve yönetimi
  status: 'queued' | 'in_progress' | 'done' | 'failed';
  error?: string;
  priority?: number;
  timeoutMs?: number;
  retries?: number;
  startedAt?: string;
  finishedAt?: string;

  // İşlem çıktıları ve özetler (her adımda eklenebilir)
  videoPath?: string;
  audioPath?: string;
  transcription?: any;
  normalizedInput?: any;
  aiResult?: any;
  faceScores?: any;
  voiceScores?: any;
  gptFeedback?: any;
  overallScore?: number;
  savedAnalysisId?: string;

  // Ek alanlar (esneklik için)
  [key: string]: any;
}