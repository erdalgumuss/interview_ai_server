import {
  getJobsToExtractAudio,
  markAudioExtracting,
  markAudioExtracted,
  PipelineStage,
} from '../modules/queue/jobStatusHelpers.ts';
import { extractAudioFromVideo } from '../modules/services/extractAudioService.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'audioExtractorWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);

    // 1. Statüyü güncelle: Audio extraction başlıyor (status + step flag)
    await markAudioExtracting(jobId);

    // 2. Audio çıkart
    const audioPath = await extractAudioFromVideo(jobData.videoPath);

    // 3. Sonuç: audio çıkarıldı (status + step flag + path + timestamp)
    await markAudioExtracted(jobId, audioPath);

    console.log(`[${WORKER_NAME}] Job ${jobId} audio extracted: ${audioPath}`);
  } catch (err) {
    // 4. Hata durumunda status "failed" ve error mesajı
    await updateJobStatus(
      jobId,
      PipelineStage.Failed,
      { 'pipelineSteps.audio_extracted': 'error' },
      undefined,
      { error: (err as any)?.message || 'Unknown error' }
    );
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
