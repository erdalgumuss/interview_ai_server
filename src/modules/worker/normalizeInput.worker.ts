// normalizeInput.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { normalizeAnalysisInput } from '../utils/normalizeQuestionAnalysisInput.ts';

export class NormalizeInputWorker extends BaseWorker {
  constructor() {
    super('normalize-input-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);
    if (!pipeline.transcription) throw new Error('Transcription data missing for normalization');

    pipeline.pipelineSteps.input_normalized.state = 'in_progress';
    pipeline.pipelineSteps.input_normalized.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      const normalizedInput = await normalizeAnalysisInput(
        pipeline.toObject(), // artık doğru tipte
        pipeline.transcription
      );

      pipeline.normalizedInput = normalizedInput;
      pipeline.pipelineSteps.input_normalized.state = 'done';
      pipeline.pipelineSteps.input_normalized.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.input_normalized.details = { summary: 'Normalization complete' };
      await pipeline.save();

      console.log(`✅ Normalization successful for pipelineId: ${pipelineId}`);
    } catch (err) {
      pipeline.pipelineSteps.input_normalized.state = 'error';
      pipeline.pipelineSteps.input_normalized.error = (err as Error).message;
      await pipeline.save();

      console.error(`❌ Normalization failed for ${pipelineId}:`, err);
      throw err;
    }
  }
}

new NormalizeInputWorker();
