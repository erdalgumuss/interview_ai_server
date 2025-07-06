import { getJobsToSave, markSaved } from '../modules/queue/jobStatusHelpers.ts';
import { ApplicationSubmissionModel } from '../modules/models/applicationSubmission.model.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'resultSaverWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'saving_results');

    // Gerekli alanlar
    const {
      applicationSubmissionId,
      videoResponseId,
      transcription,
      gptResult,
      faceResult,
      voiceResult,
      communicationScore,
      overallScore
    } = jobData;

    // Sonuçları ilgili videoResponse altına Mongo'da yaz
    const updated = await ApplicationSubmissionModel.updateOne(
      {
        _id: applicationSubmissionId,
        'videoResponses.videoResponseId': videoResponseId
      },
      {
        $set: {
          'videoResponses.$.aiAnalysis': {
            transcriptionText: transcription,
            gptResult: gptResult ? JSON.parse(gptResult) : {},
            faceResult: faceResult ? JSON.parse(faceResult) : {},
            voiceResult: voiceResult ? JSON.parse(voiceResult) : {},
            overallScore: overallScore ? Number(overallScore) : null,
            communicationScore: communicationScore ? Number(communicationScore) : null,
            // Buraya ihtiyaca göre tüm skorlar ve çıktılar eklenebilir
          },
          'videoResponses.$.status': 'completed'
        }
      }
    );

    // Başarıyla kaydedildi mi kontrol
    if (updated.modifiedCount > 0) {
      await markSaved(jobId, videoResponseId);
      await updateJobStatus(jobId, 'results_saved', { savedAnalysisId: videoResponseId });
      console.log(`[${WORKER_NAME}] Job ${jobId} analysis saved to DB.`);
    } else {
      throw new Error('Mongo update failed or nothing modified');
    }
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
