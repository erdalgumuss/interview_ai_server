import { getJobsToNormalize, markNormalized } from '../modules/queue/jobStatusHelpers.ts';
import { normalizeAnalysisInput } from '../modules/utils/normalizeQuestionAnalysisInput.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'inputNormalizerWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'normalizing_input');
    // Transkript ve diğer parametreleri normalize et
    const normalizedInput = normalizeAnalysisInput(jobData, jobData.transcription);
    await markNormalized(jobId, normalizedInput);
    await updateJobStatus(jobId, 'input_normalized', { normalizedInput });
    console.log(`[${WORKER_NAME}] Job ${jobId} normalization complete.`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      // input normalizasyonu bekleyen işler
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
