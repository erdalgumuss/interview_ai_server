import { Queue, QueueEvents } from 'bullmq';
import { redisConfig } from '../config/redis.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

// Queue oluşturuluyor
export const videoAnalysisQueue = new Queue('videoAnalysisQueue', {
  connection: redisConfig,
});

// Event dinleyicileri
const events = new QueueEvents('videoAnalysisQueue', {
  connection: redisConfig,
});

// Job tamamlanınca status güncelle
events.on('completed', async ({ jobId }) => {
  console.log(`✅ Job completed: ${jobId}`);
  if (jobId) {
    await updateJobStatus(jobId, 'completed');
  }
});

// Job hata alınca status güncelle
events.on('failed', async ({ jobId, failedReason }) => {
  console.error(`❌ Job failed: ${jobId} - ${failedReason}`);
  if (jobId) {
    await updateJobStatus(jobId, 'failed', { error: failedReason });
  }
});

videoAnalysisQueue.on('error', (err) => {
  console.error('🔥 BullMQ Queue Error:', err);
});

console.log('✅ videoAnalysisQueue initialized successfully');
