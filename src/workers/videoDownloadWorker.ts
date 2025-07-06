import {
  getJobsToDownload,
  markVideoDownloaded,
  PipelineStage
} from '../modules/queue/jobStatusHelpers';
import { downloadVideo } from '../modules/services/videoDownloadService';
import { updateJobStatus } from '../modules/queue/updateJobStatus';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'videoDownloadWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    // 1. Statüyü güncelle: Download başlıyor
    await updateJobStatus(jobId, PipelineStage.Downloading);

    // 2. Video indirme işlemi
    const videoPath = await downloadVideo(jobData.videoUrl);

    // 3. Videonun indirildiğini markla (hem Redis step flag, hem status)
    await markVideoDownloaded(jobId, videoPath);

    // 4. İsteğe bağlı: job status pipeline'da video_downloaded'a geçir
    await updateJobStatus(jobId, PipelineStage.Downloaded, { videoPath });

    console.log(`[${WORKER_NAME}] Job ${jobId} video downloaded.`);
  } catch (err) {
    await updateJobStatus(jobId, PipelineStage.Failed, { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      const jobs = await getJobsToDownload();
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
