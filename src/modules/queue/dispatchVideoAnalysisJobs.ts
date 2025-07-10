// src/modules/queue/dispatchVideoAnalysisJobs.ts

import { videoAnalysisQueue } from '../../jobs/videoAnalysisQueue.ts';
import { AnalysisJobModel } from '../models/AnalysisJob.model.ts';
import Redis from 'ioredis';
import { redisConfig } from '../../config/redis.ts';
import { PipelineStage, PipelineStepStatus } from './jobStatusHelpers.ts';

const redis = new Redis(redisConfig);

// Redis için pipeline adımlarını düzleştir:
function flattenPipelineSteps(steps: Record<string, string>) {
  return Object.entries(steps).reduce((acc, [k, v]) => {
    acc[`pipelineSteps.${k}`] = v;
    return acc;
  }, {} as Record<string, string>);
}

async function createJobInRedis(jobId: string, jobData: any) {
  // Redis hash'ine pipelineSteps'i flatten şekilde ekle
  await redis.hmset(`videoAnalysisJob:${jobId}`, {
    status: PipelineStage.Queued,
    ...flattenPipelineSteps(jobData.pipelineSteps),
    // pipelineSteps'i objeden çıkartıp diğer tüm alanları ekle
    ...Object.fromEntries(Object.entries(jobData).filter(([k]) => k !== 'pipelineSteps'))
  });
}

export const dispatchVideoAnalysisJobs = async (payloadFromApp: any) => {
  const { meta, application, interview } = payloadFromApp;
  if (!interview.questions?.length) return [];

  const jobs = [];
  for (const q of interview.questions) {
    const pipelineSteps = {
      video_downloaded: 'pending',
      audio_extracted:  'pending',
      transcribed:      'pending',
      face_analyzed:    'pending',
      voice_analyzed:   'pending',
      gpt_analyzed:     'pending',
      final_scored:     'pending',
      results_saved:    'pending',
      error:            ''
    };
    const jobData = {
      jobId:          undefined as string | undefined,
      requestId:      meta.requestId,
      applicationId:  application.id,
      videoResponseId:q.video.videoResponseId,
      questionId:     q.id,
      status:         'queued',
      pipelineSteps,      // Mongoose için nested objede tut
      priority:       q.aiMetadata?.complexityLevel === 'high' ? 1 : 3,
      timeoutMs:      Math.max((q.duration || 60) * 3 * 1000, 2 * 60 * 1000),
      retries:        0,
      candidate:      application.candidate,
      questionText:   q.questionText,
      expectedAnswer: q.expectedAnswer,
      keywords:       q.keywords,
      aiMetadata:     q.aiMetadata,
      videoUrl:       q.video.url
    };

    // BullMQ'ya ekle
    const job = await videoAnalysisQueue.add('analyze-video', jobData, {
      removeOnComplete: true,
      removeOnFail: false
    });
    jobData.jobId = job.id;

    // Redis'e kayıt: pipelineSteps flat, kalanlar normal
    if (!job.id) throw new Error('Job ID is undefined');
    await createJobInRedis(job.id, jobData);

    // Mongoose'a nested pipelineSteps objesiyle kaydet
    await AnalysisJobModel.create(jobData);

    jobs.push({
      jobId: job.id,
      videoResponseId: q.video.videoResponseId,
      questionId: q.id
    });
  }

  return jobs;
};
