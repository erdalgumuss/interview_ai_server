// src/modules/worker/questionEvaluation.worker.ts

import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { calculateCleanFaceScore } from '../academic/faceScoreService.ts';
import { calculateCleanVoiceScore } from '../academic/voiceScoreService.ts';
import { calculateQuestionEvaluationResult } from '../academic/scoreCalculatorService.ts';
import { getLLMGeneralAssessment } from '../services/llmAssessmentService.ts'; // GPT'den genel analiz almak için
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';
import type {
  ScoreWeights,
  LLMGeneralAssessment
} from '../../types/AnalysisScore.ts';

export class QuestionEvaluationWorker extends BaseWorker {
  constructor() {
    super('question-evaluation-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId, scoreWeights }: { pipelineId: string, scoreWeights?: ScoreWeights } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);

    // 1. Analiz skorlarını topla ve normalize et
    const cleanFaceScore = calculateCleanFaceScore(pipeline.faceScores);
    const cleanVoiceScore = calculateCleanVoiceScore(pipeline.voiceScores);
    const llmScore = pipeline.questionAIResult; // LLM çıktısı (önceden alınmış)

    // 2. Kullanıcıdan gelen veya default ağırlıkları ayarla
    const weights: ScoreWeights = scoreWeights || { face: 0.2, voice: 0.2, llm: 0.6 };

    // 3. Akademik skorları birleştirip final skor & breakdown’u hesapla
    let evaluationResult = calculateQuestionEvaluationResult(
      cleanFaceScore,
      cleanVoiceScore,
      llmScore,
      weights
    );

    // 4. LLM’ye detaylı değerlendirme ve IK raporu sor
    try {
      const llmCommentary: LLMGeneralAssessment = await getLLMGeneralAssessment({
        questionText: pipeline.questionText,
        expectedAnswer: pipeline.expectedAnswer,
        keywords: pipeline.keywords,
        candidate: pipeline.application?.candidate,
        interview: {
          id: pipeline.interviewId,
          title: pipeline.interviewTitle,
          order: pipeline.order,
          duration: pipeline.duration
        },
        analysisBreakdown: evaluationResult.breakdown,
        academicScores: {
          face: evaluationResult.faceScore,
          voice: evaluationResult.voiceScore,
          llm: evaluationResult.llmScore,
        },
        explanationPolicy: "Akademik ve sektör standartlarına göre; puanlar, parametrelerin etki derecesi, güvenilirlik ve yorum ile net puanlama mantığını özetle.",
        // Diğer ihtiyacın olan parametreleri ekleyebilirsin.
      });
      evaluationResult.llmCommentary = llmCommentary;
    } catch (e) {
      evaluationResult.warnings.push('LLM detaylı yorum alınamadı.');
    }

    // 5. Sonuçları kaydet ve pipeline’da ilerle
    pipeline.evaluationResult = evaluationResult;
    await pipeline.save();

    await scheduleNextStep(pipelineId, 'final_scored');
  }
}

new QuestionEvaluationWorker();
