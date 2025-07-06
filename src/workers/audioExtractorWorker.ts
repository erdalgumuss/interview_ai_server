import {
  getJobsToExtractAudio,
  markAudioExtracted,
  PipelineStage
} from '../modules/queue/jobStatusHelpers';
import { extractAudioFromVideo } from '../modules/services/extractAudioService';
import { updateJobStatus } from '../modules/queue/updateJobStatus';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'audioExtractorWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);

    // 1. Statüyü güncelle: Audio çıkartılıyor
    await updateJobStatus(jobId, PipelineStage.Processing);

    // 2. Audio çıkart
    const audioPath = await extractAudioFromVideo(jobData.videoPath);

    // 3. Sonuç: audio çıkarıldı flag'ini setle
    await markAudioExtracted(jobId, audioPath);

    // 4. Pipeline status güncelle
    await updateJobStatus(jobId, PipelineStage.AudioExtracted, { audioPath });

    console.log(`[${WORKER_NAME}] Job ${jobId} audio extracted.`);
  } catch (err) {
    await updateJobStatus(jobId, PipelineStage.Failed, { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
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
