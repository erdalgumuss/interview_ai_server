import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { VideoAnalysisModel } from '../../models/VideoAnalysis.model.ts';
import { cleanupTempFiles } from '../services/cleanupTempFiles.ts';
export class ResultsSaveWorker extends BaseWorker {
  constructor() {
    super('results-save-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);

    pipeline.pipelineSteps.results_saved.state = 'in_progress';
    pipeline.pipelineSteps.results_saved.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      // Nihai sonucu VideoAnalysis tablosuna kaydet
      const resultDoc = await VideoAnalysisModel.create({
        pipelineId,
        overallScore: pipeline.overallScore,
        aiResult: pipeline.aiResult,
        faceScores: pipeline.faceScores,
        voiceScores: pipeline.voiceScores,
        // İhtiyaca göre başka alanlar
      });
      // 2. Geçici dosya(lar)ı sil
        // 2. Geçici dosya(lar)ı sil
    const filesToCleanup = [pipeline.videoPath, pipeline.audioPath].filter(
      (f): f is string => typeof f === 'string' && f.length > 0
    );
    if (filesToCleanup.length > 0) {
      await cleanupTempFiles(filesToCleanup);
    }
      pipeline.pipelineSteps.results_saved.state = 'done';
      pipeline.pipelineSteps.results_saved.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.results_saved.details = { savedAnalysisId: resultDoc._id };
      pipeline.status = 'done'; // Pipeline bitti
      await pipeline.save();

      // Pipeline son adımıysa scheduleNextStep çağırmana gerek yok (isteğe bağlı)
    } catch (err) {
      pipeline.pipelineSteps.results_saved.state = 'error';
      pipeline.pipelineSteps.results_saved.error = (err as Error).message;
      pipeline.status = 'failed';
      await pipeline.save();
      throw err;
    }
  }
}

new ResultsSaveWorker();
