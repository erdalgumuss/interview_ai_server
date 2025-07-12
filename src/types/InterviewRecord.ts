export interface InterviewRecord {
  meta: any;               // apiVersion, requestId, callbackUrl, timestamp
  application: any;        // aday bilgileri, CV
  interview: {
    id: string;
    title?: string;
    questions: Array<{
      id: string;
      order?: number;
      duration?: number;
      questionText?: string;
      expectedAnswer?: string;
      keywords?: string[];
      aiMetadata?: any;
      videoResponseId?: string;
      videoUrl?: string;
      pipelineId?: string;  // Bu sorunun pipeline job id’si
    }>
  };
  overallScore?: number;
  finalReport?: any;
  status: 'queued' | 'in_progress' | 'done' | 'failed';
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  [key: string]: any;
}
