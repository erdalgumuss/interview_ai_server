// src/jobs/scoreCalculate.worker.ts
import { Worker } from 'bullmq';
import { redisConfig } from '../../config/redis.ts';
import { calculateFinalScores } from '../services/aiScoreCalculator.ts';

const queueName = 'scoreCalculate';

export const scoreCalculateWorker = new Worker(
  queueName,
  async (job) => {
    const { aiResults, ...rest } = job.data;
    const scores = await calculateFinalScores(aiResults, rest);
    return {
      ...rest,
      aiResults,
      scores,
    };
  },
  { connection: redisConfig }
);
