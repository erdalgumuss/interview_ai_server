import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { analyzeVoiceProsody } from '../services/voiceProsodyService.ts'; // mock/real
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';

export class VoiceAnalysisWorker extends BaseWorker {
  constructor() {
    super('voice-analysis-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);
    if (!pipeline.audioPath) throw new Error('audioPath not found in pipeline');

    pipeline.pipelineSteps.voice_analyzed.state = 'in_progress';
    pipeline.pipelineSteps.voice_analyzed.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      // Transcriptiondan kelime verisi çıkar (yoksa boş array)
      const words = pipeline.transcription?.words || [];
      const voiceResult = await analyzeVoiceProsody(pipeline.audioPath, words);

      pipeline.voiceScores = voiceResult;
      pipeline.pipelineSteps.voice_analyzed.state = 'done';
      pipeline.pipelineSteps.voice_analyzed.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.voice_analyzed.details = { ...voiceResult };
      await pipeline.save();

      // Sonraki adıma geçişi scheduler'a bırak
      await scheduleNextStep(pipelineId, 'voice_analyzed');
    } catch (err) {
      pipeline.pipelineSteps.voice_analyzed.state = 'error';
      pipeline.pipelineSteps.voice_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

new VoiceAnalysisWorker();
