import {
  getJobsToTranscribe,
  markTranscribing,
  markTranscribed,
  PipelineStage,
  PipelineStepStatus,
} from '../modules/queue/jobStatusHelpers.ts';
import { getTranscription } from '../modules/services/whisperService.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'transcriptionWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);

    // 1. Status: Transcribing başlat (flag + status)
    await markTranscribing(jobId);

    // 2. Transcript çıkar
    const transcription = await getTranscription(jobData.audioPath);

    // 3. Sonucu kaydet (flag + status + data)
    await markTranscribed(jobId, transcription);

    console.log(`[${WORKER_NAME}] Job ${jobId} transcription complete.`);
  } catch (err) {
    // Hem status hem step flag "error" olmalı
    await updateJobStatus(
      jobId,
      PipelineStage.Failed,
      { 'pipelineSteps.transcribed': PipelineStepStatus.Error },
      undefined,
      { error: (err as any)?.message || 'Unknown error' }
    );
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
