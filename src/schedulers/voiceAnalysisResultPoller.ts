// src/schedulers/voiceAnalysisResultPoller.ts

import { VideoAnalysisPipelineJobModel } from '../models/VideoAnalysisPipelineJob.model.ts';
import { getVoiceAnalysisStatus } from '../modules/services/voiceAnalyzerService.ts';
import { analyzeVoiceProsody } from '../modules/services/voiceProsodyService.ts';
import { scheduleNextStep } from './pipelineScheduler.ts';

export async function pollVoiceAnalysisResults() {
  const waitingPipelines = await VideoAnalysisPipelineJobModel.find({
    "pipelineSteps.voice_analyzed.state": "waiting"
  });

  for (const pipeline of waitingPipelines) {
    const jobId = pipeline.pipelineSteps.voice_analyzed.details?.voiceAnalysisJobId;
    if (!jobId) continue;
    try {
      // 1. Python servisinden ses analiz sonucunu al
      const result = await getVoiceAnalysisStatus(jobId);

      if (result.status === 'done') {
        // 2. Transkriptten kelime bazlı analiz (prosody) yap
        let prosodyScores = null;
        const words = pipeline.transcription?.words || [];
        if (words.length > 1) {
          prosodyScores = await analyzeVoiceProsody( words);
        }

        // 3. Sonuçları birleştir ve kaydet
        pipeline.voiceScores = {
          ...result,              // pythondan gelenler (energy, pitch, emotion vs.)
          prosody: prosodyScores  // ek olarak speech rate ve diğerleri
        };
        pipeline.pipelineSteps.voice_analyzed.state = 'done';
        pipeline.pipelineSteps.voice_analyzed.finishedAt = new Date().toISOString();
        pipeline.pipelineSteps.voice_analyzed.details = { ...result, voiceAnalysisJobId: jobId };
        await pipeline.save();

        // 4. Sonraki pipeline adımına geç
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
