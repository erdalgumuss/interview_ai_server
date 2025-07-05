//videoAnalysisQueue.ts
// --- a/file:///home/alfonso/interview_ai_server/src/modules/videoAnalysis/videoAnalysisQueue.ts
import { Queue, QueueEvents } from 'bullmq';
import { redisConfig } from '../../config/redis.ts';

export const videoAnalysisQueue = new Queue('videoAnalysisQueue', {
  connection: redisConfig,
});

const events = new QueueEvents('videoAnalysisQueue', {
  connection: redisConfig,
});

events.on('completed', ({ jobId }) => {
  console.log(`✅ Job completed: ${jobId}`);
});

events.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job failed: ${jobId} - ${failedReason}`);
});

videoAnalysisQueue.on('error', (err) => {
  console.error('🔥 BullMQ Queue Error:', err);
});

console.log('✅ videoAnalysisQueue initialized successfully');
