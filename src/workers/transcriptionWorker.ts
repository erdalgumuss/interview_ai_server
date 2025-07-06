import {
  getJobsToTranscribe,
  markTranscribed,
  PipelineStage
} from '../modules/queue/jobStatusHelpers';
import { getTranscription } from '../modules/services/whisperService';
import { updateJobStatus } from '../modules/queue/updateJobStatus';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'transcriptionWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    // 1. Status: Transcribing başlat
    await updateJobStatus(jobId, PipelineStage.Transcribing);

    // 2. Transcript çıkar
    const transcription = await getTranscription(jobData.audioPath);

    // 3. Sonucu kaydet
    await markTranscribed(jobId, transcription);

    // 4. Pipeline status güncelle
    await updateJobStatus(jobId, PipelineStage.AudioTranscribed, { transcription: transcription.text });

    console.log(`[${WORKER_NAME}] Job ${jobId} transcription complete.`);
  } catch (err) {
    await updateJobStatus(jobId, PipelineStage.Failed, { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      const jobs = await getJobsToTranscribe();
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
