// src/modules/worker/videoDownload.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { downloadVideo } from '../services/videoDownloadService.ts';
import { audioExtractQueue } from '../../config/queues.ts';

export class VideoDownloadWorker extends BaseWorker {
  constructor() {
    super('video-download-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId, videoUrl } = job.data;
    if (!pipelineId || !videoUrl) throw new Error('Missing pipelineId or videoUrl');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found`);

    pipeline.pipelineSteps.video_downloaded.state = 'in_progress';
    pipeline.pipelineSteps.video_downloaded.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      const localVideoPath = await downloadVideo(videoUrl, pipelineId);
      pipeline.videoPath = localVideoPath;
      pipeline.pipelineSteps.video_downloaded.state = 'done';
      pipeline.pipelineSteps.video_downloaded.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.video_downloaded.details = { videoPath: localVideoPath };
      await pipeline.save();
            // **BURASI ÖNEMLİ:**
      // Audio extract kuyruğuna yeni iş ekle!
      await audioExtractQueue.add('audioExtract', {
        pipelineId,
        videoPath: localVideoPath
      });
    } catch (err) {
      pipeline.pipelineSteps.video_downloaded.state = 'error';
      pipeline.pipelineSteps.video_downloaded.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

// Worker başlatılır
new VideoDownloadWorker();
