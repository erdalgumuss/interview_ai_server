// src/modules/worker/gptAnalysis.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { analyzeWithGPT } from '../services/gptService.ts';
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';
import { normalizeAnalysisInput } from '../utils/normalizeQuestionAnalysisInput.ts';

export class GPTAnalysisWorker extends BaseWorker {
  constructor() {
    super('gpt-analysis-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);
    if (!pipeline.transcription) throw new Error('Transcription missing for GPT analysis');

    pipeline.pipelineSteps.gpt_analyzed.state = 'in_progress';
    pipeline.pipelineSteps.gpt_analyzed.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      // Tüm inputu normalize et (her şey tipli ve eksiksiz olur)
      const input = normalizeAnalysisInput(
        pipeline.toObject(),
        pipeline.transcription
      );

      // GPT ile analiz yap
      const gptResult = await analyzeWithGPT(input);

      pipeline.aiResult = gptResult;
      pipeline.pipelineSteps.gpt_analyzed.state = 'done';
      pipeline.pipelineSteps.gpt_analyzed.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.gpt_analyzed.details = { summary: 'GPT analysis completed' };
      await pipeline.save();

      // Sonraki adıma geç
      await scheduleNextStep(pipelineId, 'gpt_analyzed');
    } catch (err) {
      pipeline.pipelineSteps.gpt_analyzed.state = 'error';
      pipeline.pipelineSteps.gpt_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

new GPTAnalysisWorker();
