// src/jobs/resultSave.worker.ts
import { Worker } from 'bullmq';
import { redisConfig } from '../../config/redis.ts';
import { saveAIAnalysis } from '../services/saveAIAnalysis.ts';

const queueName = 'resultSave';

export const resultSaveWorker = new Worker(
  queueName,
  async (job) => {
    const { scores, ...rest } = job.data;
    const savedAnalysisId = await saveAIAnalysis(scores, rest);
    return {
      ...rest,
      scores,
      savedAnalysisId,
    };
  },
  { connection: redisConfig }
);
