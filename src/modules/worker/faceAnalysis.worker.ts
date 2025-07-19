// src/modules/worker/faceAnalysis.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { requestFaceAnalysis } from '../services/faceAnalyzerService.ts'; // Sadece analiz başlatır!

export class FaceAnalysisWorker extends BaseWorker {
  constructor() {
    super('face-analysis-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);
    if (!pipeline.videoPath) throw new Error('videoPath not found in pipeline');

    pipeline.pipelineSteps.face_analyzed.state = 'in_progress';
    pipeline.pipelineSteps.face_analyzed.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      // 1. Python mikroservisine analiz isteği gönder — sadece job başlat!
      const jobId = await requestFaceAnalysis(pipeline.videoPath);

      // 2. JobId'yi detaylara kaydet, state'i "waiting_result" olarak işaretle
      pipeline.pipelineSteps.face_analyzed.state = 'waiting';
      pipeline.pipelineSteps.face_analyzed.details = { faceAnalysisJobId: jobId };
      await pipeline.save();

      // 3. Sonucu beklemiyoruz! Scheduler bu işi üstlenecek
      // (Burada scheduleNextStep ÇAĞRILMAZ! Çünkü analiz bitmedi)
    } catch (err) {
      pipeline.pipelineSteps.face_analyzed.state = 'error';
      pipeline.pipelineSteps.face_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

// Worker başlatılır:
new FaceAnalysisWorker();

import { pollFaceAnalysisResults } from '../../schedulers/faceAnalysisResultPoller.ts';

const POLLER_INTERVAL_MS = Number(process.env.FACE_POLLER_INTERVAL_MS) || 10_000;
// Poller da burada başlar:
setInterval(pollFaceAnalysisResults, POLLER_INTERVAL_MS);

console.log(`[FaceAnalysisWorker] Scheduler (poller) da başlatıldı.`);