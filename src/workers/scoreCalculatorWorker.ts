import { getJobsToScore, markScored } from '../modules/queue/jobStatusHelpers.ts';
import { calculateFinalScores } from '../modules/services/aiScoreCalculator.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'scoreCalculatorWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'calculating_final_scores');

    // Alt skorlar gpt, face, voice analizlerinden alınır
    const gptResult = jobData.gptResult ? JSON.parse(jobData.gptResult) : {};
    const faceResult = jobData.faceResult ? JSON.parse(jobData.faceResult) : {};
    const voiceResult = jobData.voiceResult ? JSON.parse(jobData.voiceResult) : {};

    // Skorları hesapla
    const { communicationScore, overallScore } = calculateFinalScores({
      gptScore: gptResult.answerRelevanceScore,
      confidenceScore: faceResult.confidenceScore,
      voiceConfidenceScore: voiceResult.voiceConfidenceScore,
      speechFluencyScore: voiceResult.speechFluencyScore,
    });

    // Sonucu kaydet
    await markScored(jobId, communicationScore, overallScore);
    await updateJobStatus(jobId, 'final_score_calculated', {
      communicationScore: communicationScore.toString(),
      overallScore: overallScore.toString(),

    });

    console.log(`[${WORKER_NAME}] Job ${jobId} score calculated.`);
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
