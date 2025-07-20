import { InterviewRecordModel } from '../models/InterviewRecord.model.ts';
import { createPipelineJobAndQueue } from './pipelineService.ts';

interface CreateInterviewRecordAndPipelinesParams {
  meta: any;
  application: any;
  interview: any;
}

export async function createInterviewRecordAndPipelines({
  meta,
  application,
  interview
}: CreateInterviewRecordAndPipelinesParams) {
  // 1. InterviewRecord'ı kaydet (sorulardaki pipelineId'ler olmadan)
  const interviewRecord = await InterviewRecordModel.create({
    meta,
    application,
    interview,
    status: 'queued'
  });

  // 2. Her soru için pipeline oluştur, pipelineId'yi InterviewRecord'a ekle
  const questionUpdates = [];
  for (let i = 0; i < interview.questions.length; i++) {
    const q = interview.questions[i];

    const pipelineJob = await createPipelineJobAndQueue({
      meta,
      application,
      
      interviewId: interview.id,
      interviewTitle: interview.title,
      questionId: q.id,
      order: q.order,
      duration: q.duration,
      questionText: q.questionText,
      expectedAnswer: q.expectedAnswer,
      keywords: q.keywords,
      aiMetadata: q.aiMetadata,
videoResponseId: q.video?.videoResponseId,
videoUrl: q.video?.url,
      applicationId: application.id,
      interviewRecordId: interviewRecord._id
    });

    // Sorunun pipelineId'sini InterviewRecord'a yaz
    questionUpdates.push({
      index: i,
      pipelineId: (pipelineJob._id as { toString(): string }).toString()
    });
  }

  // 3. Tüm pipelineId'leri InterviewRecord'a yaz
  for (const update of questionUpdates) {
    interviewRecord.interview.questions[update.index].pipelineId = update.pipelineId;
  }
  await interviewRecord.save();

  return interviewRecord;
}
