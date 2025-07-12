// src/jobs/aiAnalysis.worker.ts
import { Worker } from 'bullmq';
import { redisConfig } from '../../config/redis.ts';
import { runAIAnalysis } from '../services/aiAnalysisService.ts';

const queueName = 'aiAnalysis';

export const aiAnalysisWorker = new Worker(
  queueName,
  async (job) => {
    const { normalizedInput, ...rest } = job.data;
    const aiResults = await runAIAnalysis(normalizedInput, rest); // örn: face, voice, gpt
    return {
      ...rest,
      normalizedInput,
      aiResults,
    };
  },
  { connection: redisConfig }
);
