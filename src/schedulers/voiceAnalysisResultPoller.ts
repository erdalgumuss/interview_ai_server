import { VideoAnalysisPipelineJobModel } from '../models/VideoAnalysisPipelineJob.model.ts';
import { getVoiceAnalysisStatus } from '../modules/services/voiceAnalyzerService.ts';
import { scheduleNextStep } from './pipelineScheduler.ts';

export async function pollVoiceAnalysisResults() {
  const waitingPipelines = await VideoAnalysisPipelineJobModel.find({
    "pipelineSteps.voice_analyzed.state": "waiting"
  });

  for (const pipeline of waitingPipelines) {
    const jobId = pipeline.pipelineSteps.voice_analyzed.details?.voiceAnalysisJobId;
    if (!jobId) continue;
    try {
      const result = await getVoiceAnalysisStatus(jobId);

      if (result.status === 'done') {
        pipeline.voiceScores = result;
        pipeline.pipelineSteps.voice_analyzed.state = 'done';
        pipeline.pipelineSteps.voice_analyzed.finishedAt = new Date().toISOString();
        pipeline.pipelineSteps.voice_analyzed.details = { ...result, voiceAnalysisJobId: jobId };
        await pipeline.save();
        await scheduleNextStep(pipeline.id.toString(), 'voice_analyzed');
      } else if (result.status === 'failed') {
        pipeline.pipelineSteps.voice_analyzed.state = 'error';
        pipeline.pipelineSteps.voice_analyzed.error = result.error || 'Voice analysis failed';
        await pipeline.save();
      }
      // queued/processing: tekrar poll edilecek
    } catch (err) {
      console.error('[VoiceAnalysisResultPoller] Error polling:', err);
    }
  }
}

setInterval(pollVoiceAnalysisResults, 10_000);
