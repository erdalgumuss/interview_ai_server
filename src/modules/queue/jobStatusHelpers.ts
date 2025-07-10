import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.ts';
import { IAnalysisJob } from '../models/AnalysisJob.model.ts';

// ---- Pipeline ve Status Enum'ları ----
export enum PipelineStepStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Done = 'done',
  Error = 'error'
}

export enum PipelineStage {
  Queued = 'queued',
  Downloading = 'downloading_video',
  Downloaded = 'video_downloaded',
  AudioExtracted = 'audio_extracted',
  AudioTranscribed = 'audio_transcribed',
  Transcribing = 'transcribing',
  Normalizing = 'normalizing_input',
  InputNormalized = 'input_normalized',
  RunningAI = 'running_ai_analyses',
  FinalScore = 'final_score_calculated',
  ResultsSaved = 'saving_results',
  Cleaned = 'cleaned',
  Failed = 'failed',
  Processing = 'processing'
}

export interface AIStatus {
  gpt?: PipelineStepStatus;
  face?: PipelineStepStatus;
  voice?: PipelineStepStatus;
  [key: string]: PipelineStepStatus | undefined;
}

const redis = new Redis(redisConfig);

// --- Güvenli JSON parse ---
function safeJsonParse(str: any) {
  try {
    if (typeof str === 'string') return JSON.parse(str);
    return str;
  } catch {
    return undefined;
  }
}

// --- Genel: Tüm işleri çek ---
async function scanAllJobKeys(pattern = 'videoAnalysisJob:*'): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = next;
    keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

// ---- Helper: PipelineStep Güncelle (GENEL) ----
export async function updatePipelineStep(
  jobId: string,
  step: keyof IAnalysisJob['pipelineSteps'],
  value: PipelineStepStatus
) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      [`pipelineSteps.${step}`]: value,
    });
  } catch (err) {
    console.error(`[updatePipelineStep] Redis error`, err, jobId, step);
  }
}
export async function getJobsToDownload() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      (job.status === PipelineStage.Queued || job.status === PipelineStage.Downloading) &&
      !job.videoPath
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markVideoDownloading(jobId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Downloading,
      'pipelineSteps.video_downloaded': PipelineStepStatus.InProgress,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markVideoDownloading] Redis error`, err, jobId);
  }
}

export async function markVideoDownloaded(jobId: string, videoPath: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Downloaded,
      'pipelineSteps.video_downloaded': PipelineStepStatus.Done,
      videoPath,
      videoDownloadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markVideoDownloaded] Redis error`, err, jobId);
  }
}

// ---- Audio Extraction ----
export async function getJobsToExtractAudio() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.Downloaded &&
      !job.audioPath
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markAudioExtracting(jobId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Processing,
      'pipelineSteps.audio_extracted': PipelineStepStatus.InProgress,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAudioExtracting] Redis error`, err, jobId);
  }
}

export async function markAudioExtracted(jobId: string, audioPath: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.AudioExtracted,
      'pipelineSteps.audio_extracted': PipelineStepStatus.Done,
      audioPath,
      audioExtractedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAudioExtracted] Redis error`, err, jobId);
  }
}


// ... (devamında diğer adımlar aynı mantıkta ilerletilebilir)

// ---- Transcription ----// ---- Transcription ----
export async function getJobsToTranscribe() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.AudioExtracted &&
      !job.transcription
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markTranscribing(jobId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Transcribing,
      'pipelineSteps.transcribed': PipelineStepStatus.InProgress,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markTranscribing] Redis error`, err, jobId);
  }
}

export async function markTranscribed(jobId: string, transcription: any) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.AudioTranscribed,
      'pipelineSteps.transcribed': PipelineStepStatus.Done,
      transcription: typeof transcription === 'string' ? transcription : JSON.stringify(transcription),
      transcribedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markTranscribed] Redis error`, err, jobId);
  }
}

// ---- Normalize Input ----
export async function getJobsToNormalize() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.AudioTranscribed &&
      !job.normalizedInput
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markNormalizing(jobId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Normalizing,
      'pipelineSteps.input_normalized': PipelineStepStatus.InProgress,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markNormalizing] Redis error`, err, jobId);
  }
}

export async function markNormalized(jobId: string, normalizedInput: any) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.InputNormalized,
      'pipelineSteps.input_normalized': PipelineStepStatus.Done,
      normalizedInput: typeof normalizedInput === 'string'
        ? normalizedInput
        : JSON.stringify(normalizedInput),
      normalizedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markNormalized] Redis error`, err, jobId);
  }
}

// ---- AI Analizleri ----
export async function getJobsToRunAI() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.InputNormalized &&
      job.ai // AI status objesi var mı?
    ) {
      const aiStatus = safeJsonParse(job.ai);
      if (['gpt', 'face', 'voice'].some(k => aiStatus?.[k] === PipelineStepStatus.Pending)) {
        jobs.push({ jobId, jobData: job });
      }
    }
  }
  return jobs;
}

export async function markAIRunning(jobId: string, aiStatus?: AIStatus) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.RunningAI,
      'pipelineSteps.gpt_analyzed': PipelineStepStatus.InProgress,
      'pipelineSteps.face_analyzed': PipelineStepStatus.InProgress,
      'pipelineSteps.voice_analyzed': PipelineStepStatus.InProgress,
      ...(aiStatus ? { ai: JSON.stringify(aiStatus) } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAIRunning] Redis error`, err, jobId);
  }
}

export async function markAIRun(jobId: string, aiStatus: AIStatus) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      ai: JSON.stringify(aiStatus),
      aiRanAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAIRun] Redis error`, err, jobId);
  }
}

export async function markAIDone(jobId: string, aiStatus: AIStatus) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.RunningAI,
      'pipelineSteps.gpt_analyzed': PipelineStepStatus.Done,
      'pipelineSteps.face_analyzed': PipelineStepStatus.Done,
      'pipelineSteps.voice_analyzed': PipelineStepStatus.Done,
      ai: JSON.stringify(aiStatus),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAIDone] Redis error`, err, jobId);
  }
}

// ---- Skor Hesaplama ----
export async function getJobsToScore() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    const aiStatus = job.ai ? safeJsonParse(job.ai) : {};
    if (
      job.status === PipelineStage.RunningAI &&
      aiStatus.gpt === PipelineStepStatus.Done &&
      aiStatus.face === PipelineStepStatus.Done &&
      aiStatus.voice === PipelineStepStatus.Done &&
      !job.overallScore
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markScored(jobId: string, communicationScore: number, overallScore: number) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.FinalScore,
      'pipelineSteps.final_scored': PipelineStepStatus.Done,
      communicationScore: communicationScore.toString(),
      overallScore: overallScore.toString(),
      scoredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markScored] Redis error`, err, jobId);
  }
}

// ---- Sonuçları MongoDB'ye Kaydet ----
export async function getJobsToSave() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.FinalScore &&
      !job.savedAnalysisId
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markSaved(jobId: string, savedAnalysisId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.ResultsSaved,
      'pipelineSteps.results_saved': PipelineStepStatus.Done,
      savedAnalysisId,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markSaved] Redis error`, err, jobId);
  }
}

// ---- Cleanup ----
export async function getJobsToCleanup() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.ResultsSaved &&
      job.cleaned !== 'true'
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markCleaned(jobId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Cleaned,
      cleaned: 'true',
      cleanedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markCleaned] Redis error`, err, jobId);
  }
}

// ---- GPT Adımı İçin Özel ----
export async function getJobsForGPTAnalysis() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    const aiStatus = job.ai ? safeJsonParse(job.ai) : {};
    if (
      job.status === PipelineStage.InputNormalized &&
      aiStatus.gpt !== PipelineStepStatus.Done &&
      aiStatus.gpt !== PipelineStepStatus.Error // veya Failed
    ) {
      jobs.push({ jobId, jobData: { ...job, aiStatus } });
    }
  }
  return jobs;
}

export async function markGptAnalyzed(jobId: string, gptResult: any) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      'pipelineSteps.gpt_analyzed': PipelineStepStatus.Done,
      gptResult: typeof gptResult === 'string' ? gptResult : JSON.stringify(gptResult),
      gptAnalyzedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markGptAnalyzed] Redis error`, err, jobId);
  }
}
