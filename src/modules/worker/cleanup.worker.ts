// src/jobs/cleanup.worker.ts
import { Worker } from 'bullmq';
import { redisConfig } from '../../config/redis.ts';
import { cleanupTempFiles } from '../services/cleanupTempFiles.ts';

const queueName = 'cleanup';

export const cleanupWorker = new Worker(
  queueName,
  async (job) => {
    await cleanupTempFiles(job.data); // videoPath, audioPath, geçici dosyalar
    return {
      ...job.data,
      cleanup: true,
    };
  },
  { connection: redisConfig }
);
