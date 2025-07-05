// src/workers/scoreCalculatorWorker.ts
import { getJobsToScore, markScored } from '../modules/queue/jobStatusHelpers.ts';
import { calculateFinalScores } from '../modules/services/aiScoreCalculator.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'scoreCalculatorWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    await updateJobStatus(jobId, 'calculating_final_scores', jobData.aiStatus);
    // AI sonuçlarını al
    const { gptResult, faceResult, voiceResult } = jobData;
    const { communicationScore, overallScore } = calculateFinalScores({
      gptScore: JSON.parse(gptResult).answerRelevanceScore,
      confidenceScore: JSON.parse(faceResult).confidenceScore,
      voiceConfidenceScore: JSON.parse(voiceResult).voiceConfidenceScore,
      speechFluencyScore: JSON.parse(voiceResult).speechFluencyScore,
    });
    await markScored(jobId, communicationScore, overallScore);
    await updateJobStatus(jobId, 'final_score_calculated', { communicationScore, overallScore });
    console.log(`[${WORKER_NAME}] Job ${jobId} scores calculated`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      const jobs = await getJobsToScore();
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
