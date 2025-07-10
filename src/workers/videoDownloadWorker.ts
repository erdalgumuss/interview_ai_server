import {
  getJobsToDownload,
  markVideoDownloading,
  markVideoDownloaded,
  PipelineStage,
} from '../modules/queue/jobStatusHelpers.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';
import { downloadVideo } from '../modules/services/videoDownloadService.ts';

const POLL_INTERVAL_MS = 2000;
const WORKER_NAME = 'videoDownloadWorker';

// Her job için iş akışı
async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);

    // 1) Pipeline'da video downloading'e geçiş (hem status, hem adım flag)
    await markVideoDownloading(jobId);

    // 2) Video indirme işlemi
    const videoPath = await downloadVideo(jobData.videoUrl);

    // 3) İndirilen dosya kaydediliyor (status, pipeline step + path, timestamp)
    await markVideoDownloaded(jobId, videoPath);

    console.log(`[${WORKER_NAME}] Job ${jobId} video downloaded: ${videoPath}`);
  } catch (err) {
    // 4) Hata durumunda hem status, hem hata log
    await markVideoDownloaded(
      jobId,
      '' // hata durumunda videoPath boş bırakılır
    );
    await updateJobStatus(jobId, PipelineStage.Failed, { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

// Polling loop
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
