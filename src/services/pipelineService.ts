import { VideoAnalysisPipelineJobModel } from '../models/VideoAnalysisPipelineJob.model.ts';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { VideoAnalysisPipelineJob } from '../types/VideoAnalysisPipelineJob.ts';
import { redisConfig } from '../config/redis.ts';


export async function createPipelineJobAndQueue(data: Partial<VideoAnalysisPipelineJob>) {
  const now = new Date().toISOString();

  const defaultSteps = {
    video_downloaded: { state: 'pending' },
    audio_extracted: { state: 'pending' },
    transcribed: { state: 'pending' },
    face_analyzed: { state: 'pending' },
    voice_analyzed: { state: 'pending' },
    question_analyzed: { state: 'pending' }, // Yeni adım eklendi
    question_evaluated: { state: 'pending' },
    results_saved: { state: 'pending' }
  };

  const job: VideoAnalysisPipelineJob = {
    ...data,
    meta: {
      ...data.meta,
      timestamp: now,
      requestId: data.meta?.requestId || uuidv4(),
      apiVersion: data.meta?.apiVersion || '1.0.0'
    },
    pipelineSteps: defaultSteps,
    status: 'queued',
    retries: 0
  } as VideoAnalysisPipelineJob;

  const mongoDoc = await VideoAnalysisPipelineJobModel.create(job) as InstanceType<typeof VideoAnalysisPipelineJobModel>;

  const videoDownloadQueue = new Queue('video-download-queue', { connection: redisConfig });
  await videoDownloadQueue.add('videoDownload', {
    pipelineId: (mongoDoc._id as unknown as { toString(): string }).toString(),
    videoUrl: job.videoUrl
  });

  return mongoDoc;
}
