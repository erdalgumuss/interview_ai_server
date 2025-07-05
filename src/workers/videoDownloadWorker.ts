import { getJobsToDownload, markVideoDownloaded } from '../modules/queue/jobStatusHelpers.ts';
import { downloadVideo } from '../modules/services/videoDownloadService.ts';
import { updateJobStatus } from '../modules/queue/updateJobStatus.ts';

const POLL_INTERVAL_MS = 2000; // Her 2 sn'de bir kontrol et
const WORKER_NAME = 'videoDownloadWorker';

async function processJob(jobId: string, jobData: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${jobId}`);
    await updateJobStatus(jobId, 'downloading_video');
    // Videoyu indir
    const videoPath = await downloadVideo(jobData.videoUrl);
    // Flag: video indirildi
    await markVideoDownloaded(jobId, videoPath);
    await updateJobStatus(jobId, 'video_downloaded', { videoPath });
    console.log(`[${WORKER_NAME}] Job ${jobId} video downloaded.`);
  } catch (err) {
    await updateJobStatus(jobId, 'failed', { error: (err as any)?.message || 'Unknown error' });
    console.error(`[${WORKER_NAME}] Job ${jobId} failed:`, err);
  }
}

async function poll() {
  while (true) {
    try {
      // Bu fonksiyon iş sırası kendine gelen ve videosu indirilmeyen işleri döner:
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
