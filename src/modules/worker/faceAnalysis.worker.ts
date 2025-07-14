import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { analyzeFaceAndGestures } from '../services/faceAnalysisService.ts'; // mock/real service
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';

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
      // Burada gerçek servise geçiş yapabilirsin
      const analysisResult = await analyzeFaceAndGestures(pipeline.videoPath);

      pipeline.faceScores = analysisResult; // Detayları burada tutabilirsin
      pipeline.pipelineSteps.face_analyzed.state = 'done';
      pipeline.pipelineSteps.face_analyzed.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.face_analyzed.details = { ...analysisResult };
      await pipeline.save();

      // Sonraki adıma geçiş için scheduler'ı çağır
      await scheduleNextStep(pipelineId, 'face_analyzed');
    } catch (err) {
      pipeline.pipelineSteps.face_analyzed.state = 'error';
      pipeline.pipelineSteps.face_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

// Worker başlat
new FaceAnalysisWorker();
