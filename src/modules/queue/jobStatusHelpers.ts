// src/modules/queue/jobStatusHelpers.ts

import Redis from 'ioredis';
import { redisConfig } from '../../config/redis';

// ---- Pipeline ve Status Enum'ları ----
export enum PipelineStepStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum PipelineStage {
  Queued = 'queued',
  Downloading = 'downloading_video',
  Downloaded = 'video_downloaded',
  AudioExtracted = 'audio_extracted',
  AudioTranscribed = 'audio_transcribed',
  InputNormalized = 'input_normalized',
  RunningAI = 'running_ai_analyses',
  FinalScore = 'final_score_calculated',
  ResultsSaved = 'saving_results',
  Cleaned = 'cleaned',
  Failed = 'failed',
  Processing = 'processing',
  Transcribing = 'transcribing',
  Normalizing = 'normalizing_input',
}

export interface AIStatus {
  gpt?: PipelineStepStatus;
  face?: PipelineStepStatus;
  voice?: PipelineStepStatus;
  [key: string]: PipelineStepStatus | undefined;
}

const redis = new Redis(redisConfig);

// --- Utility: Güvenli JSON parse ---
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

// ---- İş Adımına Göre İşleri Getir ----

export async function getJobsToDownload() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === PipelineStage.Queued ||
      job.status === PipelineStage.Downloading
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markVideoDownloaded(jobId: string, videoPath: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.Downloaded,
      videoPath,
      videoDownloadedAt: new Date().toISOString(),
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
    if (job.status === PipelineStage.Downloaded && !job.audioPath) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markAudioExtracted(jobId: string, audioPath: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.AudioExtracted,
      audioPath,
      audioExtractedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAudioExtracted] Redis error`, err, jobId);
  }
}

// ---- Transcription ----
export async function getJobsToTranscribe() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === PipelineStage.AudioExtracted && !job.transcription) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markTranscribed(jobId: string, transcription: any) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.AudioTranscribed,
      transcription: typeof transcription === 'string' ? transcription : JSON.stringify(transcription),
      transcribedAt: new Date().toISOString(),
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
    if (job.status === PipelineStage.AudioTranscribed && !job.normalizedInput) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markNormalized(jobId: string, normalizedInput: any) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.InputNormalized,
      normalizedInput: typeof normalizedInput === 'string'
        ? normalizedInput
        : JSON.stringify(normalizedInput),
      normalizedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markNormalized] Redis error`, err, jobId);
  }
}

// ---- AI Analizleri & Skor ----

export async function getJobsToRunAI() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === PipelineStage.InputNormalized && job.ai) {
      const aiStatus = safeJsonParse(job.ai);
      // En az bir AI adımı 'pending' ise işleme alınır
      if (['gpt', 'face', 'voice'].some(k => aiStatus?.[k] === PipelineStepStatus.Pending)) {
        jobs.push({ jobId, jobData: job });
      }
    }
  }
  return jobs;
}

export async function markAIRun(jobId: string, aiStatus: AIStatus) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.RunningAI,
      ai: JSON.stringify(aiStatus),
      aiRanAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markAIRun] Redis error`, err, jobId);
  }
}

export async function getJobsToScore() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    // AI analizler completed ve skor hesaplanmamışsa
    const aiStatus = job.ai ? JSON.parse(job.ai) : {};
    if (
      job.status === 'running_ai_analyses' &&
      aiStatus.gpt === 'completed' &&
      aiStatus.face === 'completed' &&
      aiStatus.voice === 'completed' &&
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
      communicationScore: communicationScore.toString(),
      overallScore: overallScore.toString(),
      scoredAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[markScored] Redis error`, err, jobId);
  }
}

// ---- Save Results to Mongo ----
export async function getJobsToSave() {
  const jobKeys = await scanAllJobKeys();
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === PipelineStage.FinalScore && !job.savedAnalysisId) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markSaved(jobId: string, savedAnalysisId: string) {
  try {
    await redis.hmset(`videoAnalysisJob:${jobId}`, {
      status: PipelineStage.ResultsSaved,
      savedAnalysisId,
      savedAt: new Date().toISOString(),
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
    if (job.status === PipelineStage.ResultsSaved && job.cleaned !== 'true') {
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
    });
  } catch (err) {
    console.error(`[markCleaned] Redis error`, err, jobId);
  }
}
export async function getJobsForGPTAnalysis() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    // Sadece input_normalized ve ai.gpt != completed && != failed ise al
    const aiStatus = job.ai ? JSON.parse(job.ai) : {};
    if (
      job.status === 'input_normalized' &&
      aiStatus.gpt !== 'completed' &&
      aiStatus.gpt !== 'failed'
    ) {
      jobs.push({ jobId, jobData: { ...job, aiStatus } });
    }
  }
  return jobs;
}

export async function markGptAnalyzed(jobId: string, gptResult: any) {
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    gptResult: typeof gptResult === 'string' ? gptResult : JSON.stringify(gptResult),
    gptAnalyzedAt: new Date().toISOString(),
    // Not: ai status güncellenmesi updateJobStatus'ta
  });
}