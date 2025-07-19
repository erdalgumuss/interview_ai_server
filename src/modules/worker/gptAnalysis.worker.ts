import { Job } from 'bullmq';
import { BaseWorker } from './base/baseWorker.ts';
import { VideoAnalysisPipelineJobModel } from '../../models/VideoAnalysisPipelineJob.model.ts';
import { analyzeWithGPT } from '../services/gptService.ts';
import { scheduleNextStep } from '../../schedulers/pipelineScheduler.ts';
import type { GPTAnalysisInput } from '../../types/aiAnalysis.types.ts';

export class GPTAnalysisWorker extends BaseWorker {
  constructor() {
    super('gpt-analysis-queue');
  }

  protected async handleJob(job: Job): Promise<void> {
    const { pipelineId } = job.data;
    if (!pipelineId) throw new Error('Missing pipelineId!');

    // 1. Pipeline'ı çek
    const pipeline = await VideoAnalysisPipelineJobModel.findById(pipelineId);
    if (!pipeline) throw new Error(`PipelineJob ${pipelineId} not found!`);

    pipeline.pipelineSteps.gpt_analyzed.state = 'in_progress';
    pipeline.pipelineSteps.gpt_analyzed.startedAt = new Date().toISOString();
    await pipeline.save();

    try {
      // -- Extract all analysis input
      const q = pipeline.question || pipeline;
      const c = pipeline.application?.candidate || {};
      const p = pipeline.personalityTest?.scores || {};
      const voice = pipeline.voiceScores || {};
      const face = pipeline.faceScores || {};

      // -- Güvenli sayısal dönüşüm helper
      const num = (x: any) => (typeof x === 'string' ? Number(x) : x);

      // -- Aşırı uzun transcriptleri kısalt (örnek)
      const transcript = (pipeline.transcription?.text || '').slice(0, 3000);

      // -- Input tipi ile uyumlu hazırla
      const gptInput: GPTAnalysisInput = {
        questionText:     q.questionText || '',
        expectedAnswer:   q.expectedAnswer || '',
        keywords:         q.keywords || [],
        complexityLevel:  q.aiMetadata?.complexityLevel || '',
        requiredSkills:   q.aiMetadata?.requiredSkills || [],
        candidateSkills:     c.skills?.technical || [],
        candidateExperience: c.experience?.map((e: any) => `${e.company}: ${e.position}`) || [],
        candidateEducation:  c.education?.map((e: any) => `${e.school} (${e.degree}, ${e.graduationYear})`) || [],
        documents:           c.documents || [],
        personalityScores:   p || {},
        personalityFit:      pipeline.personalityTest?.personalityFit ?? null,
        transcript,

        // Ses/voice analizi
        voiceProsody:          voice.prosody || undefined,
        voiceEmotionScores:    voice.emotionScores || undefined,
        dominantVoiceEmotion:  voice.dominantEmotion || undefined,
        energyMean:            num(voice.energyMean),
        pitchMean:             num(voice.pitchMean),
        pitchStd:              num(voice.pitchStd),
        snrEstimate:           num(voice.snrEstimate),

        // Video/yüz analizi
        faceEmotionScores:     face.emotionScores || undefined,
        dominantFaceEmotion:   face.dominantEmotion || undefined,
        attentionScore:        num(face.attentionScore),
        eyeContactScore:       num(face.eyeContactScore),

        // Süre ve meta
        videoDuration:   num(pipeline.videoDuration ?? pipeline.duration),
        audioDuration:   num(pipeline.audioDuration),
        backgroundNoise: num(voice.backgroundNoise),

        // Diğer
        applicationStatus: pipeline.application?.status || undefined,
        retryCount:        pipeline.retryCount ?? undefined,
        maxRetryAttempts:  pipeline.maxRetryAttempts ?? undefined,
        supportRequests:   pipeline.supportRequests?.map((r: any) => r.message) || undefined,
      };

      // 4. GPT ile analiz et
      const gptResult = await analyzeWithGPT(gptInput);

      pipeline.aiResult = gptResult;
      pipeline.pipelineSteps.gpt_analyzed.state = 'done';
      pipeline.pipelineSteps.gpt_analyzed.finishedAt = new Date().toISOString();
      pipeline.pipelineSteps.gpt_analyzed.details = { summary: 'GPT analysis completed' };
      await pipeline.save();

      // 5. Sonraki adım
      await scheduleNextStep(pipelineId, 'gpt_analyzed');
    } catch (err) {
      pipeline.pipelineSteps.gpt_analyzed.state = 'error';
      pipeline.pipelineSteps.gpt_analyzed.error = (err as Error).message;
      await pipeline.save();
      throw err;
    }
  }
}

new GPTAnalysisWorker();
