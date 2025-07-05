//addVideoAnalysisJob.ts
import { videoAnalysisQueue } from '../videoAnalysis/videoAnalysisQueue.ts';

interface VideoAnalysisJobData {
  videoUrl: string;
  applicationId: string;
  questionId?: string;
  interviewId?: string;
}

export const addVideoAnalysisJob = async (data: VideoAnalysisJobData) => {
  const job = await videoAnalysisQueue.add('analyze-video', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });

  console.log(`📥 Job enqueued: ID=${job.id}, App=${data.applicationId}`);
};
