// src/schedulers/faceAnalysisResultPoller.ts

import { VideoAnalysisPipelineJobModel } from '../models/VideoAnalysisPipelineJob.model.ts';
import { getFaceAnalysisStatus } from '../modules/services/faceAnalyzerService.ts';
import { scheduleNextStep } from './pipelineScheduler.ts';

export async function pollFaceAnalysisResults() {
  // waiting_result durumundaki tüm işler
  const waitingPipelines = await VideoAnalysisPipelineJobModel.find({
    "pipelineSteps.face_analyzed.state": "waiting"
  });

  for (const pipeline of waitingPipelines) {
    const jobId = pipeline.pipelineSteps.face_analyzed.details?.faceAnalysisJobId;
    if (!jobId) continue;
    try {
      const result = await getFaceAnalysisStatus(jobId);

      if (result.status === 'done') {
        // Sonucu işle, pipeline'ı güncelle
        pipeline.faceScores = result;
        pipeline.pipelineSteps.face_analyzed.state = 'done';
        pipeline.pipelineSteps.face_analyzed.finishedAt = new Date().toISOString();
        pipeline.pipelineSteps.face_analyzed.details = {  faceAnalysisJobId: jobId };
        await pipeline.save();
        await scheduleNextStep(pipeline.id.toString(), 'face_analyzed');
      } else if (result.status === 'failed') {
        pipeline.pipelineSteps.face_analyzed.state = 'error';
        pipeline.pipelineSteps.face_analyzed.error = result.error || 'Face analysis failed';
        await pipeline.save();
      }
      // queued/processing durumunda tekrar poll edilecek (hiçbir şey yapma)
    } catch (err) {
      // Bağlantı vs. hatası — logla, scheduler tekrar deneyecek
      console.error('[FaceAnalysisResultPoller] Error polling:', err);
    }
  }
}

// Cron ile veya app başında:
//setInterval(pollFaceAnalysisResults, 10_000); // 10 saniyede bir kontrol et
