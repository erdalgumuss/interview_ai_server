// modules/queue/dispatchVideoAnalysisJobs.ts

import { videoAnalysisQueue } from '../videoAnalysis/videoAnalysisQueue';
import { updateJobStatus, AIAnalysisStatus } from './updateJobStatus';
import { IApplicationSubmission } from '../models/applicationSubmission.model';


export const dispatchVideoAnalysisJobs = async (submission: IApplicationSubmission) => {
  if (!submission.videoResponses?.length) return [];

  const jobs = [];

  // _id'yi güvenle stringe çevir
  const applicationSubmissionId =
    typeof submission._id === 'string'
      ? submission._id
      : submission._id?.toString ? submission._id.toString() : '';

  for (const video of submission.videoResponses) {
    const jobData = {
      applicationSubmissionId: applicationSubmissionId,
      videoResponseId: video.videoResponseId,
      videoUrl: video.videoUrl,
      questionId: video.questionId ? video.questionId.toString() : '',
      interviewId: submission.interviewId ? submission.interviewId.toString() : '',
  };

    const job = await videoAnalysisQueue.add('analyze-video', jobData, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    // Pipeline step başlangıçları
    const pipelineSteps = {
      video_downloaded: 'pending',
      audio_extracted: 'pending',
      transcribed: 'pending',
      face_analyzed: 'pending',
      voice_analyzed: 'pending',
      gpt_analyzed: 'pending',
      final_scored: 'pending',
      results_saved: 'pending',
      error: '',
    };

    // AI analizler (detaylı statüler)
    const aiStatus: AIAnalysisStatus = {
      face: 'pending',
      voice: 'pending',
      gpt: 'pending',
      // yeni analizler kolayca eklenir
    };

    await updateJobStatus(job.id?.toString() ?? '', 'queued', pipelineSteps, aiStatus);

    jobs.push({ jobId: job.id, videoResponseId: video.videoResponseId });
  }

  return jobs;
};
