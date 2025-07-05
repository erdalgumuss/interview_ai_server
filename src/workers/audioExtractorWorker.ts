import { getJobsToExtractAudio, markAudioExtracted } from '../modules/queue/jobStatusHelpers.ts';
import { extractAudioFromVideo } from '../modules/services/extractAudioService.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'audioExtractorWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'extracting_audio');
    // Audio çıkart
    const audioPath = await extractAudioFromVideo(jobData.videoPath);
    // Flag: audio çıkarıldı
    await markAudioExtracted(jobId, audioPath);
    await updateJobStatus(jobId, 'audio_extracted', { audioPath });
    console.log(`[${WORKER_NAME}] Job ${jobId} audio extracted.`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      // Bu fonksiyon, sesi çıkarılacak işleri bulur:
      const jobs = await getJobsToExtractAudio();
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
