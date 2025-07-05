import { getJobsToTranscribe, markTranscribed } from '../modules/queue/jobStatusHelpers.ts';
import { getTranscription } from '../modules/services/whisperService.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'transcriptionWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'transcribing_audio');
    // Transcript çıkar
    const transcription = await getTranscription(jobData.audioPath);
    // Sonucu ve flag’i kaydet
    await markTranscribed(jobId, transcription);
    await updateJobStatus(jobId, 'audio_transcribed', { transcription });
    console.log(`[${WORKER_NAME}] Job ${jobId} transcription complete.`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      // Bu fonksiyon, transkript çıkarılacak işleri bulur:
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
