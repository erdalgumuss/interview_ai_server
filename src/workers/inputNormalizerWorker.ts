import {
  getJobsToNormalize,
  markNormalized,
  PipelineStage
} from '../modules/queue/jobStatusHelpers.ts';
import { normalizeAnalysisInput } from '../modules/utils/normalizeQuestionAnalysisInput.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'inputNormalizerWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);

    // 1. Status: Normalizing başlat
    await updateJobStatus(jobId, PipelineStage.Normalizing);

    // 2. Normalize et (sadece input’u değil, gerekiyorsa interview, question gibi bağlamı da ekle)
    const normalizedInput = normalizeAnalysisInput(jobData, jobData.transcription);

    // 3. Sonucu kaydet
    await markNormalized(jobId, normalizedInput);

    // 4. Status güncelle
    await updateJobStatus(jobId, PipelineStage.InputNormalized, { normalizedInput: JSON.stringify(normalizedInput) });

    console.log(`[${WORKER_NAME}] Job ${jobId} normalization complete.`);
  } catch (err) {
    await updateJobStatus(jobId, PipelineStage.Failed, { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      const jobs = await getJobsToNormalize();
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
