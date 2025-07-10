// src/workers/resultSaverWorker.ts

import { getJobsToSave, markSaved } from '../modules/queue/jobStatusHelpers.ts';
import { AnalysisJobModel } from '../modules/models/AnalysisJob.model.ts';
import { VideoAnalysisModel } from '../modules/models/VideoAnalysis.model.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'resultSaverWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'saving_results');

    // Gerekli AI sonuçlarını jobData'dan çıkar
    const {
      applicationId,
      videoResponseId,
      questionId,
      transcript,
      sentiment,
      keywordCoverage,
      matchingScore,
      faceScores,
      voiceScores,
      gptFeedback,
      overallScore,
      version
    } = jobData;

    // 1) Analiz sonucunu VideoAnalysisModel koleksiyonuna kaydet
    const created = await VideoAnalysisModel.create({
      jobId,
      applicationId,
      videoResponseId,
      questionId,
      transcript,
      sentiment,
      keywordCoverage,
      matchingScore,
      faceScores,
      voiceScores,
      gptFeedback,
      overallScore,
      version: version || 'v1.0.0'
    });

    // 2) İşin pipeline ve genel statusunu güncelle
    await updateJobStatus(jobId, 'results_saved', { savedAnalysisId: String(created._id) });

    // 3) (Opsiyonel) Mark as saved (queue logic)
    await markSaved(jobId, videoResponseId);

    console.log(`[${WORKER_NAME}] Job ${jobId} analysis saved to DB (analysisId: ${created._id}).`);

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
