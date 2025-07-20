import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { analyzeQuestionAnswerWithLLM } from '../services/questionAnswerAIService.ts';
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';
import type { QuestionAIInput, QuestionAnswerAIResult } from '../utils/QuestionAnswerAIPrompt.ts';
import { questionAnalyzedQueue } from '../../config/queues.ts';
export class QuestionAnswerAIWorker extends BaseWorker {
  constructor() {
    super('question-analyzed-queue'); // Kuyruk adını istediğin gibi ayarla
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    // 1. Pipeline kaydını çek
    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);

    pipeline.pipelineSteps.question_analyzed = pipeline.pipelineSteps.question_analyzed || {};
    pipeline.pipelineSteps.question_analyzed.state = 'in_progress';
    pipeline.pipelineSteps.question_analyzed.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      // 2. Soru ve aday cevabını hazırla
      const q = pipeline.question || pipeline;
      const input: QuestionAIInput = {
        questionText:   q.questionText,
        expectedAnswer: q.expectedAnswer,
        keywords:       q.keywords || [],
        aiMetadata:     q.aiMetadata || {},
        transcript:     pipeline.transcription?.text || '', // transkript pipeline’da tutuluyor olmalı
      };

      // 3. LLM ile analiz et
      const questionAIResult: QuestionAnswerAIResult = await analyzeQuestionAnswerWithLLM(input);

      // 4. Sonucu pipeline'a kaydet
      pipeline.questionAIResult = questionAIResult; // veya pipeline.questionAIResult gibi ayrı bir alan
      pipeline.pipelineSteps.question_analyzed.state = 'done';
      pipeline.pipelineSteps.question_analyzed.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.question_analyzed.details = { summary: 'Question-Answer LLM analysis completed' };
      await pipeline.save();

      // 5. Sonraki adım
      await scheduleNextStep(pipelineId, 'question_analyzed');
    } catch (err) {
      pipeline.pipelineSteps.question_analyzed.state = 'error';
      pipeline.pipelineSteps.question_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

new QuestionAnswerAIWorker();
