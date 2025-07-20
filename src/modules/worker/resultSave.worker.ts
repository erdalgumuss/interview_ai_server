// src/modules/worker/resultsSave.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { InterviewRecordModel } from '../../models/InterviewRecord.model.ts';
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
      // 1. InterviewRecord’u bul
      const interviewRecordId = pipeline.interviewRecordId;
      const interviewRecord = await InterviewRecordModel.findById(interviewRecordId);
      if (!interviewRecord) throw new Error('InterviewRecord not found!');

      // 2. Doğru soruyu bulup tüm analiz çıktılarıyla birlikte kaydet
      const questionIdx = interviewRecord.interview.questions.findIndex(
        (q) => q.id === pipeline.questionId
      );
      if (questionIdx === -1) throw new Error('Matching question not found in interviewRecord!');

      // Kapsamlı analiz kaydı
      interviewRecord.interview.questions[questionIdx].analysis = {
        faceScores: pipeline.faceScores,
        voiceScores: pipeline.voiceScores,
        questionAIResult: pipeline.questionAIResult,
        evaluationResult: pipeline.evaluationResult
      };

   

      // 4. (İsteğe bağlı): Tüm analizlerden özet çıkar ve finalReport'a ekle
      // interviewRecord.finalReport = {...};

      await interviewRecord.save();

      // 5. Geçici dosya(lar)ı temizle
      const filesToCleanup = [pipeline.videoPath, pipeline.audioPath].filter(
        (f): f is string => typeof f === 'string' && f.length > 0
      );
      if (filesToCleanup.length > 0) {
        await cleanupTempFiles(filesToCleanup);
      }

      // 6. Pipeline durumunu güncelle
      pipeline.pipelineSteps.results_saved.state = 'done';
      pipeline.pipelineSteps.results_saved.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.results_saved.details = { savedInterviewRecordId: interviewRecord._id };
      pipeline.status = 'done';
      await pipeline.save();
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
