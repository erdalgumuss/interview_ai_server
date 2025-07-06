// src/workers/gptAnalysisWorker.ts

import { getJobsForGPTAnalysis, markGptAnalyzed } from '../modules/queue/jobStatusHelpers.ts';
import { analyzeWithGPT } from '../modules/services/gptService.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'gptAnalysisWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    // adım statusunu güncelle
    await updateJobStatus(jobId, 'gpt_analysis_in_progress', undefined, { gpt: 'in_progress' });

    // normalize edilmiş inputu al (gerekirse jobData.normalizedInput)
    const gptResult = await analyzeWithGPT(jobData.normalizedInput);

    // Sonucu kaydet & aiStatus.gpt tamamlandı
    await markGptAnalyzed(jobId, gptResult);

    await updateJobStatus(
      jobId,
      'gpt_analysis_completed',
      undefined,
      { gpt: 'completed' }, // aiStatus güncellendi!
      { gptResult }
    );

    console.log(`[${WORKER_NAME}] Job ${jobId} GPT analysis complete.`);
  } catch (err) {
    await updateJobStatus(
      jobId,
      'failed',
      undefined,
      { gpt: 'failed' },
      { error: (err as any)?.message || 'Unknown error' }
    );
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      // Sadece GPT analizi bekleyen işleri bulur!
      const jobs = await getJobsForGPTAnalysis();
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
