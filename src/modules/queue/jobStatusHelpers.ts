// src/modules/queue/jobStatusHelpers.ts
import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.ts';
const redis = new Redis(redisConfig);

export async function getJobsToDownload() {
  // Basit örnek: tüm işleri tarar, status:queued ise döner
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === 'queued' || job.status === 'downloading_video') {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markVideoDownloaded(jobId: string, videoPath: string) {
  // Status: video_downloaded olarak set et
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    status: 'video_downloaded',
    videoPath,
    videoDownloadedAt: new Date().toISOString(),
  });
}
// src/modules/queue/jobStatusHelpers.ts

// Sadece video_downloaded statusünde olan işler (veya audio çıkmamışlar)
export async function getJobsToExtractAudio() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === 'video_downloaded' && !job.audioPath) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

// Çıktı flagini güncelle
export async function markAudioExtracted(jobId: string, audioPath: string) {
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    status: 'audio_extracted',
    audioPath,
    audioExtractedAt: new Date().toISOString(),
  });
}
export async function getJobsToTranscribe() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === 'audio_extracted' && !job.transcription) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markTranscribed(jobId: string, transcription: any) {
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    status: 'audio_transcribed',
    transcription: typeof transcription === 'string' ? transcription : JSON.stringify(transcription),
    transcribedAt: new Date().toISOString(),
  });
}

// src/modules/queue/jobStatusHelpers.ts

export async function getJobsToNormalize() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    // input_normalized olmayan ve transcript çıkarılmış işler
    if (job.status === 'audio_transcribed' && !job.normalizedInput) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markNormalized(jobId: string, normalizedInput: any) {
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    status: 'input_normalized',
    normalizedInput: typeof normalizedInput === 'string'
      ? normalizedInput
      : JSON.stringify(normalizedInput),
    normalizedAt: new Date().toISOString(),
  });
}
// AI analizler tamamlanan ve skorlanmamış işleri bulur
export async function getJobsToScore() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (
      job.status === 'running_ai_analyses' &&
      job.aiStatus &&
      ['completed','completed','completed'].every(
        (s, i) => JSON.parse(job.aiStatus)[['gpt','face','voice'][i]] === 'completed'
      ) &&
      !job.overallScore
    ) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markScored(jobId: string, communicationScore: number, overallScore: number) {
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    communicationScore,
    overallScore,
    scoredAt: new Date().toISOString(),
  });
}
export async function getJobsToSave() {
  const jobKeys = await redis.keys('videoAnalysisJob:*');
  const jobs = [];
  for (const key of jobKeys) {
    const jobId = key.split(':')[1];
    const job = await redis.hgetall(key);
    if (job.status === 'final_score_calculated' && !job.savedAnalysisId) {
      jobs.push({ jobId, jobData: job });
    }
  }
  return jobs;
}

export async function markSaved(jobId: string, savedAnalysisId: string) {
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    savedAnalysisId,
    savedAt: new Date().toISOString(),
  });
}
