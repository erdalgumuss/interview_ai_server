// src/types/VideoAnalysisPipelineJob.ts

export type PipelineStepState = 'pending' | 'in_progress' | 'done' | 'error';

export interface PipelineStep {
  state: PipelineStepState;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  details?: any; // O adımın spesifik çıktısı (örn. faceScores, videoPath, vs.)
}

// Adım isimlerini merkezi ve type-safe olarak tanımla:
export type PipelineStepKey =
  | 'video_downloaded'
  | 'audio_extracted'
  | 'transcribed'
  | 'face_analyzed'
  | 'voice_analyzed'
  | 'gpt_analyzed'
  | 'final_scored'
  | 'results_saved'

export type PipelineStepMap = Record<PipelineStepKey, PipelineStep>;

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

  pipelineSteps: PipelineStepMap; // <- tip güvenli adım tanımı

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
