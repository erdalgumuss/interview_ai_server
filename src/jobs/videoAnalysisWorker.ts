import { Worker } from 'bullmq';
import { redisConfig } from '../config/redis.ts';
import { processVideoAnalysis } from '../modules/videoAnalysis/videoAnalysisPipeline.ts';
import { connectMongoDB } from '../config/db.ts';
import dotenv from 'dotenv';

dotenv.config();
await connectMongoDB();

const videoWorker = new Worker(
  'videoAnalysisQueue',
  async (job) => {
    try {
      console.log(`🚀 [${new Date().toISOString()}] Processing job ${job.id}`);
      const start = Date.now();
      const result = await processVideoAnalysis(job.data);
      const duration = Date.now() - start;
      console.log(`✅ Job ${job.id} completed in ${duration}ms`);
      return result;
    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: 1,
    lockDuration: 600000, // 10 dakikalık job kilidi
  }
);

// Event listener'lar
videoWorker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} marked as completed`);
});

videoWorker.on('failed', (job, err) => {
  console.error(`🔥 Job ${job?.id} failed (attempts: ${job?.attemptsMade}):`, err.message);
});

export default videoWorker;
