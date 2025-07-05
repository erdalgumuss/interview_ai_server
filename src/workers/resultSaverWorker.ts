// src/workers/resultSaverWorker.ts
import { getJobsToSave, markSaved } from '../modules/queue/jobStatusHelpers.ts';
import { saveAIAnalysisResult } from '../modules/videoAnalysis/saveAIAnalysis.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'resultSaverWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    await updateJobStatus(jobId, 'saving_results', jobData.aiStatus);
    const savedResult = await saveAIAnalysisResult({
      videoResponseId: jobData.videoResponseId,
      applicationId: jobData.applicationId,
      transcription: jobData.transcription,
      gptResult: jobData.gptResult,
      faceResult: jobData.faceResult,
      voiceResult: jobData.voiceResult,
      overallScore: jobData.overallScore,
      communicationScore: jobData.communicationScore,
    });
    await markSaved(jobId, savedResult._id);
    await updateJobStatus(jobId, 'completed', { savedAnalysisId: savedResult._id });
    console.log(`[${WORKER_NAME}] Job ${jobId} results saved`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      const jobs = await getJobsToSave();
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
