import { getJobsToCleanup, markCleaned } from '../modules/queue/jobStatusHelpers.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';
import fs from 'fs/promises';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'cleanupWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'cleaning_up');

    // Geçici dosyaları temizle (videoPath, audioPath gibi)
    const paths = [];
    if (jobData.videoPath) paths.push(jobData.videoPath);
    if (jobData.audioPath) paths.push(jobData.audioPath);

    for (const path of paths) {
      try {
        await fs.unlink(path);
        console.log(`[${WORKER_NAME}] Deleted temp file: ${path}`);
      } catch (e) {
        console.warn(
          `[${WORKER_NAME}] Warning: Couldn't delete ${path}:`,
          e instanceof Error ? e.message : String(e)
        );
      }
    }

    await markCleaned(jobId);
    await updateJobStatus(jobId, 'completed', { cleaned: 'true' });
    console.log(`[${WORKER_NAME}] Job ${jobId} cleanup complete.`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} cleanup failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      const jobs = await getJobsToCleanup();
      for (const { jobId, jobData } of jobs) {
        await processJob(jobId, jobData);
      }
    } catch (e) {
      console.error(`[${WORKER_NAME}] Poll error:`, e);
    }
    await new Promise(res => setTimeout(res, POLL_INTERVAL_MS));
  }
}

poll();
