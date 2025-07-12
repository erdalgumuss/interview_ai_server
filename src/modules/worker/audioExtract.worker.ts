// src/modules/worker/audioExtract.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { extractAudioFromVideo } from '../services/extractAudioService.ts';
import { transcriptionQueue } from '../../config/queues.ts';

export class AudioExtractWorker extends BaseWorker {
  constructor() {
    super('audio-extract-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline || !pipeline.videoPath) throw new Error('Pipeline or videoPath not found');

    pipeline.pipelineSteps.audio_extracted.state = 'in_progress';
    pipeline.pipelineSteps.audio_extracted.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      const audioPath = await extractAudioFromVideo(pipeline.videoPath, '/tmp');
      pipeline.audioPath = audioPath;
      pipeline.pipelineSteps.audio_extracted.state = 'done';
      pipeline.pipelineSteps.audio_extracted.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.audio_extracted.details = { audioPath };
      await pipeline.save();
            // 🎯 Burada bir sonraki adım için kuyruğa ekle!
      await transcriptionQueue.add('transcription', {
        pipelineId,
        audioPath
      });

    } catch (err) {
      pipeline.pipelineSteps.audio_extracted.state = 'error';
      pipeline.pipelineSteps.audio_extracted.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

// Worker başlatılır:
new AudioExtractWorker();
