import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { requestVoiceAnalysis } from '../services/voiceAnalyzerService.ts';

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
      const jobId = await requestVoiceAnalysis(pipeline.audioPath);

      pipeline.pipelineSteps.voice_analyzed.state = 'waiting';
      pipeline.pipelineSteps.voice_analyzed.details = { voiceAnalysisJobId: jobId };
      await pipeline.save();
      // Sonucu beklemiyoruz!
    } catch (err) {
      pipeline.pipelineSteps.voice_analyzed.state = 'error';
      pipeline.pipelineSteps.voice_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

new VoiceAnalysisWorker();
import { pollVoiceAnalysisResults } from '../../schedulers/voiceAnalysisResultPoller.ts';

const POLLER_INTERVAL_MS = Number(process.env.FACE_POLLER_INTERVAL_MS) || 10_000;

// Worker başlatılır:

// Poller da burada başlar:
setInterval(pollVoiceAnalysisResults, POLLER_INTERVAL_MS);

console.log(`[VoiceAnalysisWorker] Scheduler (poller) da başlatıldı.`);