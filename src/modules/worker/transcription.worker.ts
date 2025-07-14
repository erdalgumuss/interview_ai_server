import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { getTranscription } from '../services/whisperService.ts';
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';

export class TranscriptionWorker extends BaseWorker {
  constructor() {
    super('transcription-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);
    if (!pipeline.audioPath) throw new Error(`audioPath not found in pipeline ${pipelineId}`);

    pipeline.pipelineSteps.transcribed.state = 'in_progress';
    pipeline.pipelineSteps.transcribed.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      const transcription = await getTranscription(pipeline.audioPath);
      pipeline.transcription = transcription;
      pipeline.pipelineSteps.transcribed.state = 'done';
      pipeline.pipelineSteps.transcribed.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.transcribed.details = { summary: 'Transcription completed' };
      await pipeline.save();
     // 🚀 Burada bir sonraki adım için kuyruğa ekle!
         await scheduleNextStep(pipelineId, 'transcribed');


    } catch (err) {
      pipeline.pipelineSteps.transcribed.state = 'error';
      pipeline.pipelineSteps.transcribed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

new TranscriptionWorker();
